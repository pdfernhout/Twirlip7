define(["vendor/sha256", "vendor/mithril"], function(sha256, mDiscard) {
    "use strict"

    // returns position + 1 for item reference to avoid first item being "0"
    const NotebookUsingServer = {
        itemForLocation: [],
        itemForHash: {},
        streamId: "common",
        userId: "anonymous",
        socket: null,
        isLoaded: false,
        onLoadedCallback: null,
        messagesReceivedCount: 0,

        getCapabilities() {
            return {
                idIsPosition: false,
                addItem: true,
                getItem: true,
                itemCount: true,
                textForNotebook: true,
                loadFromNotebookText: true,
                skip: true,
            }
        },

        addItem(item, isFromServer) {
            const reference = "" + sha256.sha256(item)
            const storedItem = NotebookUsingServer.itemForHash[reference]
            if (storedItem) {
                return { id: reference, location: storedItem.location, existed: true }
            }
            const newLocation = NotebookUsingServer.itemForLocation.length
            const newStoredItem = { id: reference, location: newLocation, item: item }
            NotebookUsingServer.itemForLocation.push(newStoredItem)
            NotebookUsingServer.itemForHash[reference] = newStoredItem
            // The insertion order may not be the same on other clients; applications need to not depend on it
            if (!isFromServer) NotebookUsingServer.sendInsertItemMessage(item)
            return { id: reference, location: newLocation, existed: false }
        },

        getItem(reference) {
            if (reference === null) return null
            const storedItem = NotebookUsingServer.itemForHash[reference]
            return storedItem ? storedItem.item : null
        },
        
        getItemForLocation(location) {
            const storedItem = NotebookUsingServer.itemForLocation[location]
            return storedItem ? storedItem.item : null
        },

        itemCount() {
            return NotebookUsingServer.itemForLocation.length
        },

        textForNotebook() {
            const result = []
            for (let i = 0; i < NotebookUsingServer.itemForLocation.length; i++) {
                const storedItem = NotebookUsingServer.itemForLocation[i]
                result.push(storedItem.item)
            }
            return JSON.stringify(result, null, 4)
        },

        clearItems() {
            NotebookUsingServer.itemForLocation = []
            NotebookUsingServer.itemForHash = {}
        },
        
        loadFromNotebookText(notebookText) {
            // TODO: Need to think abotu what this means ont he server...
            alert("Replacing Notebook not yet supported on server")
            return
            /*
            NotebookUsingServer.clearItems()
            const items = JSON.parse(notebookText)
            for (let item of items) { NotebookUsingServer.addItem(item) }
            */
        },
        
        locationForKey(key) {
            if (key === null || key === "") return null
            const storedItem = NotebookUsingServer.itemForHash[key]
            return storedItem ? storedItem.location : null
        },
        
        keyForLocation(location) {
            const storedItem = NotebookUsingServer.itemForLocation[location]
            return storedItem ? storedItem.id : null
        },
        
        skip(reference, delta, wrap) {
            const itemCount = NotebookUsingServer.itemCount()
            if (itemCount === 0) return null
            let start = (!reference) ? null : NotebookUsingServer.locationForKey(reference)
            if (start === null) {
                if (wrap) {
                    // when wrapping, want +1 to go to 0 or -1 to go to end
                    if (delta === 0) {
                        start = 0
                    } else if (delta > 0) {
                        start = -1
                    } else {
                        start = itemCount
                    }
                } else {
                    // if not wrapping, negative deltas get us nowhere, and positive deltas go from start
                    start = -1
                }
            }

            let location
            if (wrap) {
                delta = delta % itemCount
                location = (start + delta + itemCount) % itemCount
            } else {
                location = start + delta
                if (location < 0) location = 0
                if (location >= itemCount) location = itemCount - 1
            }
            return NotebookUsingServer.keyForLocation(location)
        },
        
        // =============== socket.io communications
        
        sendMessage(message) {
            NotebookUsingServer.socket.emit("twirlip", message)
        },
        
        sendInsertItemMessage(item) {
            NotebookUsingServer.sendMessage({command: "insert", streamId: NotebookUsingServer.streamId, item: item, userId: NotebookUsingServer.userId, timestamp: new Date().toISOString()})
        },
        
        requestAllMessages() {
            console.log("requestAllMessages", NotebookUsingServer.messagesReceivedCount)
            NotebookUsingServer.sendMessage({command: "listen", streamId: NotebookUsingServer.streamId, fromIndex: NotebookUsingServer.messagesReceivedCount})
        },
        
        messageReceived(message) {
            // console.log("messageReceived", message)
            if (message.command === "insert") {
                NotebookUsingServer.messagesReceivedCount++
                NotebookUsingServer.addItem(message.item, "isFromServer")
            } else if (message.command === "remove") {
                NotebookUsingServer.messagesReceivedCount++
                console.log("TODO: Remove message not handled")
            } else if (message.command === "reset") {
                NotebookUsingServer.messagesReceivedCount++
                // TODO: Should handle timestamps somehow, so earlier messages before last reset are rejected
                NotebookUsingServer.clearItems()
            } else if (message.command === "loaded") {
                // Don't increment messagesReceivedCount as "loaded" is an advisory meta message from server
                NotebookUsingServer.isLoaded = true
                console.log("all server data loaded", NotebookUsingServer.messagesReceivedCount, new Date().toISOString())
                if (NotebookUsingServer.onLoadedCallback) NotebookUsingServer.onLoadedCallback()
            }
            m.redraw()
        },
        
        setup(io) {
            // TODO: Concern: Want to get all messages, but new messages may be added while waiting
            NotebookUsingServer.socket = io()
            
            NotebookUsingServer.socket.on("twirlip", function(message) {
                // console.log("twirlip", message)
                if (message.streamId === NotebookUsingServer.streamId) {
                    NotebookUsingServer.messageReceived(message)
                }
            })
            
            NotebookUsingServer.socket.on("connect", function(client) {
                console.log("connect", NotebookUsingServer.socket.id, NotebookUsingServer.messagesReceivedCount, new Date().toISOString())
                NotebookUsingServer.requestAllMessages()
            })
        }
    }

    return NotebookUsingServer
})