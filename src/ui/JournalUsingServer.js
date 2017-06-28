define(["vendor/sha256", "vendor/mithril"], function(sha256, mDiscard) {
    "use strict"

    // returns position + 1 for item reference to avoid first item being "0"
    const JournalUsingServer = {
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
                textForJournal: true,
                loadFromJournalText: true,
                skip: true,
            }
        },

        addItem(item, isFromServer) {
            const reference = "" + sha256.sha256(item)
            const storedItem = JournalUsingServer.itemForHash[reference]
            if (storedItem) {
                return { id: reference, location: storedItem.location, existed: true }
            }
            const newLocation = JournalUsingServer.itemForLocation.length
            const newStoredItem = { id: reference, location: newLocation, item: item }
            JournalUsingServer.itemForLocation.push(newStoredItem)
            JournalUsingServer.itemForHash[reference] = newStoredItem
            // The insertion order may not be the same on other clients; applications need to not depend on it
            if (!isFromServer) JournalUsingServer.sendInsertItemMessage(item)
            return { id: reference, location: newLocation, existed: false }
        },

        getItem(reference) {
            if (reference === null) return null
            const storedItem = JournalUsingServer.itemForHash[reference]
            return storedItem ? storedItem.item : null
        },
        
        getItemForLocation(location) {
            const storedItem = JournalUsingServer.itemForLocation[location]
            return storedItem ? storedItem.item : null
        },

        itemCount() {
            return JournalUsingServer.itemForLocation.length
        },

        textForJournal() {
            const result = []
            for (let i = 0; i < JournalUsingServer.itemForLocation.length; i++) {
                const storedItem = JournalUsingServer.itemForLocation[i]
                result.push(storedItem.item)
            }
            return JSON.stringify(result, null, 4)
        },

        clearItems() {
            JournalUsingServer.itemForLocation = []
            JournalUsingServer.itemForHash = {}
        },
        
        loadFromJournalText(journalText) {
            // TODO: Need to think abotu what this means ont he server...
            alert("Replacing Journal not yet supported on server")
            return
            /*
            JournalUsingServer.clearItems()
            const items = JSON.parse(journalText)
            for (let item of items) { JournalUsingServer.addItem(item) }
            */
        },
        
        locationForKey(key) {
            if (key === null || key === "") return null
            const storedItem = JournalUsingServer.itemForHash[key]
            return storedItem ? storedItem.location : null
        },
        
        keyForLocation(location) {
            const storedItem = JournalUsingServer.itemForLocation[location]
            return storedItem ? storedItem.id : null
        },
        
        skip(reference, delta, wrap) {
            const itemCount = JournalUsingServer.itemCount()
            if (itemCount === 0) return null
            let start = (!reference) ? null : JournalUsingServer.locationForKey(reference)
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
            return JournalUsingServer.keyForLocation(location)
        },
        
        // =============== socket.io communications
        
        sendMessage(message) {
            JournalUsingServer.socket.emit("twirlip", message)
        },
        
        sendInsertItemMessage(item) {
            JournalUsingServer.sendMessage({command: "insert", streamId: JournalUsingServer.streamId, item: item, userId: JournalUsingServer.userId, timestamp: new Date().toISOString()})
        },
        
        requestAllMessages() {
            JournalUsingServer.sendMessage({command: "listen", streamId: JournalUsingServer.streamId})
        },
        
        messageReceived(message) {
            JournalUsingServer.messagesReceivedCount++
            // console.log("messageReceived", message)
            if (message.command === "insert") {
                JournalUsingServer.addItem(message.item, "isFromServer")
            } else if (message.command === "remove") {
                console.log("TODO: Remove message not handled")
            } else if (message.command === "reset") {
                // TODO: Should handle timestamps somehow, so earlier messages before last reset are rejected
                JournalUsingServer.clearItems()
            } else if (message.command === "loaded") {
                JournalUsingServer.isLoaded = true
                if (JournalUsingServer.onLoadedCallback) JournalUsingServer.onLoadedCallback()
            }
            m.redraw()
        },
        
        setup(io) {
            // TODO: Concern: Want to get all messages, but new messages may be added while waiting
            JournalUsingServer.socket = io()
            
            JournalUsingServer.socket.on("twirlip", function(message) {
                if (message.streamId === JournalUsingServer.streamId) {
                    JournalUsingServer.messageReceived(message)
                }
            })
            
            JournalUsingServer.socket.on("connect", function(client) {
                console.log("connect", JournalUsingServer.socket.id)
                
                JournalUsingServer.requestAllMessages()
            })
        }
    }

    return JournalUsingServer
})