define(["vendor/sha256"], function(sha256) {
    "use strict"

    // returns position + 1 for item reference to avoid first item being "0"
    function NotebookBackendUsingServer(aRedrawCallback, streamId = "common", userId = "anonymous") {
        let socket = null
        let messagesReceivedCount = 0
        let notebook = null
        let redrawCallback = aRedrawCallback

        function addItem(item) {
            sendInsertItemMessage(item)
        }

        // =============== socket.io communications

        function sendMessage(message) {
            socket.emit("twirlip", message)
        }

        function sendInsertItemMessage(item, alternateStreamId) {
            sendMessage({command: "insert", streamId: alternateStreamId || streamId, item: item, userId: userId, timestamp: new Date().toISOString()})
        }

        function requestAllMessages() {
            console.log("requestAllMessages", messagesReceivedCount)
            sendMessage({command: "listen", streamId: streamId, fromIndex: messagesReceivedCount})
        }

        function messageReceived(message) {
            // console.log("messageReceived", message)
            if (message.command === "insert") {
                messagesReceivedCount++
                notebook.addItem(message.item, "isFromServer")
            } else if (message.command === "remove") {
                messagesReceivedCount++
                console.log("TODO: Remove message not handled")
            } else if (message.command === "reset") {
                messagesReceivedCount++
                // TODO: Should handle timestamps somehow, so earlier messages before last reset are rejected
                // clearItems()
                console.log("TODO: clear items not handled")
            } else if (message.command === "loaded") {
                // Don't increment messagesReceivedCount as "loaded" is an advisory meta message from server
                console.log("all server data loaded", messagesReceivedCount, new Date().toISOString())
                notebook.onLoaded()
            }
            if (redrawCallback) redrawCallback()
        }

        function setup(io) {
            console.log("setup", io)
            // TODO: Concern: Want to get all messages, but new messages may be added while waiting
            socket = io()

            socket.on("twirlip", function(message) {
                // console.log("twirlip", message)
                if (JSON.stringify(message.streamId) === JSON.stringify(streamId)) {
                    messageReceived(message)
                }
            })

            socket.on("connect", function() {
                console.log("connect", socket.id, messagesReceivedCount, new Date().toISOString())
                requestAllMessages()
            })
        }

        function connect(aNotebook) {
            notebook = aNotebook
        }

        function disconnect() {
            sendMessage({command: "unlisten", streamId: streamId})
        }

        function configure(streamIdNew, userIdNew) {
            if (streamIdNew !== undefined) {
                sendMessage({command: "unlisten", streamId: streamId})
                streamId = streamIdNew
                messagesReceivedCount = 0
                requestAllMessages()
            }
            if (userIdNew !== undefined) userId = userIdNew
        }

        return {
            addItem,
            sendMessage,
            sendInsertItemMessage,
            connect,
            setup,
            configure,
            isSetup: function() { return !!socket }
        }
    }

    return NotebookBackendUsingServer
})
