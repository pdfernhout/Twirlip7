# Server API

Most of the interaction with streams (i.e. "notebooks" or "journals") on the server is done via socket.io. Each stream has an ID which is the SHA256 of a JSON object in canonical form. 

There are also a couple of supplemental server-side APIs for proxying requests (to get aroudn CORS) and to retrieve streams as file resources with a specific content-type.

### POST /api/proxy

Request data from another server via GET.

The body should include url field and proxyKey (i.e. password) field. See proxy-rss-reader.js for an example.

        apiRequestSend("/api/proxy", { url, proxyKey }, 10000, (result) => {
            fetchResult = { status: result.status }
            if (result.success) {
                sourceContent = result.content
                // console.log("sourceContent", sourceContent)
                rssFeedInstance = parseRSS(sourceContent)
                // console.log("proxy request success", result)
            } else {
                fetchResult.errorMessage = result.errorMessage
            }
            m.redraw()
        }, (failed) => {
            console.log("proxy request failed", failed)
            loadingError = JSON.stringify(failed)
            fetchResult = { status: "failed" }
            m.redraw()
        })

### GET /sha256/:sha256

Retrieve a stream referenced by sha256 as a file with a specific content-type, title, and/or file name. Useful for displaying resources in a browser (e.g. as an image).

Example URL: http://localhost:8080/sha256/somesha?content-type=image/png&title=some%20title

Resources must have been created with a specific format. See chat.js uploadDocumentClicked for an example.

    function uploadDocumentClicked() {
        FileUtils.loadFromFile(true, (filename, contents, bytes) => {
            // console.log("result", filename, contents)
            // alert("upload unfinished: " + filename)
            const sha256 = calculateSHA256(bytes)
            // console.log("file info:", filename, contents, bytes, sha256)
            /*
            const uploadResponder = {
                onLoaded: () => {},
                addItem: (item, isAlreadyStored) => {}
            }

            const upload = StreamBackendUsingServer(m.redraw, {sha256: null}, userID)
            upload.connect(uploadResponder)
            upload.setup(io)
            */

            function chunkSubstr(str, size) {
                // from: https://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript/29202760#29202760
                const numChunks = Math.ceil(str.length / size)
                const chunks = new Array(numChunks)

                for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
                    chunks[i] = str.substr(o, size)
                }

                return chunks
            }

            const segmentSize = 100000
            const segments = chunkSubstr(contents, 100000)
            const alternateStreamId = {sha256: sha256}

            // TODO: No error handling
            // TODO: Does not check if it exists already
            backend.sendInsertItemMessage({a: "sha256:" + sha256, b: "filename", c: filename}, alternateStreamId)
            backend.sendInsertItemMessage({a: "sha256:" + sha256, b: "format", c: "base64-segments"}, alternateStreamId)
            backend.sendInsertItemMessage({a: "sha256:" + sha256, b: "bytes-byteLength", c: bytes.byteLength}, alternateStreamId)
            backend.sendInsertItemMessage({a: "sha256:" + sha256, b: "base64-length", c: contents.length}, alternateStreamId)
            backend.sendInsertItemMessage({a: "sha256:" + sha256, b: "base64-segment-count", c: segments.length}, alternateStreamId)
            backend.sendInsertItemMessage({a: "sha256:" + sha256, b: "base64-segment-size", c: segmentSize}, alternateStreamId)
            // let reconstruct = ""
            for (let i = 0; i < segments.length; i++) {
                // console.log("sending", i + 1, "of", segments.length)
                // reconstruct += segments[i]
                backend.sendInsertItemMessage({a: "sha256:" + sha256, b: "base64-segment:" + i, c: segments[i]}, alternateStreamId)
            }

            console.log("uploaded", filename, sha256)

            const sha256WithFileName = sha256 + "?filename=" + encodeURIComponent(filename)

            let textToAdd = `[${filename}](sha256/${sha256WithFileName})`

            // Format as markdown image if it might be an image
            const extension = filename.substr(filename.lastIndexOf(".") + 1)
            const isImageFile = {ai: true, bmp: true, gif: true, ico: true, jpg: true, jpeg: true, png: true, psd: true, svg: true, tif: true, tiff: true}[extension]
            if (isImageFile) textToAdd = `![${filename}](sha256/${sha256WithFileName} "${filename}")`

            if (chatText) chatText += ""

            chatText += textToAdd

            m.redraw()

            /* verification
            function _base64ToArrayBuffer(base64) {
                // from: https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
                const binary_string =  window.atob(base64)
                const len = binary_string.length
                const bytes = new Uint8Array( len )
                for (let i = 0; i < len; i++)        {
                    bytes[i] = binary_string.charCodeAt(i)
                }
                return bytes.buffer
            }
            console.log("reconstruct.length", reconstruct.length)
            console.log("binary length", _base64ToArrayBuffer(reconstruct).byteLength)
            */
        })
    }

### Socket.io messages

See StreamBackendUsingServer.js for API details

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
            responder.addItem(message.item, "isFromServer")
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
            responder.onLoaded()
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

    function connect(aResponder) {
        responder = aResponder
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