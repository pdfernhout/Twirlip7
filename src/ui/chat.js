/* global m */
/* eslint-disable no-console */

define(["/socket.io/socket.io.js", "NotebookBackendUsingServer", "HashUtils", "vendor/push", "vendor/marked", "FileUtils", "vendor/sha256", "vendor/mithril"], function(io, NotebookBackendUsingServer, HashUtils, Push, marked, FileUtils, calculateSHA256, mDiscard) {
    "use strict"

    console.log("NotebookBackendUsingServer", NotebookBackendUsingServer)

    let chatRoom = "test"
    let userID = localStorage.getItem("userID") || "anonymous"
    let chatText = ""
    const messages = []

    let messagesDiv = null

    function startup() {
        chatRoom = HashUtils.getHashParams()["chatRoom"] || chatRoom
        window.onhashchange = () => updateChatRoomFromHash()
        updateHashForChatRoom()
    }

    function updateTitleForChatRoom() {
        const title = document.title.split(" -- ")[0]
        document.title = title + " -- " + chatRoom
    }

    function updateChatRoomFromHash() {
        const hashParams = HashUtils.getHashParams()
        const newChatRoom = hashParams["chatRoom"]
        if (newChatRoom !== chatRoom) {
            chatRoom = newChatRoom
            backend.configure({chatRoom})
            updateTitleForChatRoom()
        }
    }

    function updateHashForChatRoom() {
        const hashParams = HashUtils.getHashParams()
        hashParams["chatRoom"] = chatRoom
        HashUtils.setHashParams(hashParams)
        updateTitleForChatRoom()
    }

    function chatRoomChange(event) {
        chatRoom = event.target.value
        messages.splice(0)
        updateHashForChatRoom()
        backend.configure({chatRoom})
    }

    function userIDChange(event) {
        userID = event.target.value
        backend.configure(undefined, userID)
        localStorage.setItem("userID", userID)
    }

    function chatTextChange(event) {
        chatText = event.target.value
    }

    function sendChatMessage() {
        const timestamp = new Date().toISOString()
        const command = "insert"

        sendMessage({ chatText, userID, timestamp })
        chatText= ""
    }

    function sendMessage(message) {
        backend.addItem(message)
    }

    function textAreaKeyDown(event) {
        console.log("onkeydown", event.keyCode, event)
        if (event.keyCode === 13) {
            chatText = event.target.value
            sendChatMessage()
            return false
        }
        event.redraw = false
        return true
    }

    function formatChatMessage(text) {
        return m.trust(marked(text))
    }

    function uploadClicked() {
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

            const upload = NotebookBackendUsingServer({sha256: null}, userID)
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
                console.log("sending", i + 1, "of", segments.length)
                // reconstruct += segments[i]
                backend.sendInsertItemMessage({a: "sha256:" + sha256, b: "base64-segment:" + i, c: segments[i]}, alternateStreamId)
            }

            console.log("uploaded", filename, sha256)

            const sha256WithFileName = sha256 + "?filename=" + filename

            let textToAdd = `sha256/${sha256WithFileName}`

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
                var binary_string =  window.atob(base64)
                var len = binary_string.length
                var bytes = new Uint8Array( len )
                for (var i = 0; i < len; i++)        {
                    bytes[i] = binary_string.charCodeAt(i)
                }
                return bytes.buffer
            }
            console.log("reconstruct.length", reconstruct.length)
            console.log("binary length", _base64ToArrayBuffer(reconstruct).byteLength)
            */
        })
    }

    const TwirlipChat = {
        view: function () {
            return m("div..pa2.overflow-hidden.flex.flex-column.h-100.w-100", [
                // m("h4.tc", "Twirlip Chat"),
                m("div.mb3",
                    m("span.dib.tr.w4", "Twirlip chat room:"),
                    m("input", {value: chatRoom, onchange: chatRoomChange}),
                    m("span.dib.tr.w4", "User ID:"),
                    m("input", {value: userID, onchange: userIDChange}),
                    m("a.pl2", {href: "https://github.github.com/gfm/", target: "_blank"}, "Markdown documentation")
                ),
                m("div.overflow-auto.flex-auto",
                    {
                        oncreate: (vnode) => {
                            messagesDiv = (vnode.dom)
                        },
                    },
                    messages.map(function (message) {
                        var localeTimestamp = new Date(Date.parse(message.timestamp)).toLocaleString()
                        return m("div.pa2", [
                            m("span", {title: localeTimestamp, style: "font-size: 80%;"}, m("i", message.userID + " @ " + localeTimestamp)),
                            m(".pl4.pr4", formatChatMessage(message.chatText))
                        ])
                    })
                ),
                m("br"),
                m("div",
                    m("textarea.h4.w-80", {value: chatText, onchange: chatTextChange, onkeydown: textAreaKeyDown}),
                    m("button.ml2", {onclick: sendChatMessage}, "Send"),
                    m("button.ml2", {onclick: uploadClicked}, "Upload..."),
                )
            ])
        }
    }

    const chatRoomResponder = {
        onLoaded: () => console.log("onLoaded"),
        addItem: (item, isAlreadyStored) => {
            console.log("addItem", item)
            messages.push(item)
            setTimeout(() => {
                messagesDiv.scrollTop = messagesDiv.scrollHeight
            }, 0)
            if (!document.hasFocus()) {
                Push.create(item.userID + ": " + item.chatText)
            }
        }
    }

    startup()

    const backend = NotebookBackendUsingServer({chatRoom}, userID)

    backend.connect(chatRoomResponder)
    backend.setup(io)

    window.onload = () => m.mount(document.body, TwirlipChat)
})
