/* global m, io, marked, Push, sha256 */
/* eslint-disable no-console */

"use strict"

// Assumes socket.io loaded from script tag to define io

import { NotebookBackendUsingServer } from "./NotebookBackendUsingServer.js"
import { HashUtils } from "./HashUtils.js"

// defines marked
import "./vendor/marked.js"

import { FileUtils } from "./FileUtils.js"

// defines sha256
import "./vendor/sha256.js"
const calculateSHA256 = sha256

// defines m
import "./vendor/mithril.js"

let chatRoom = "test"
let userID = localStorage.getItem("userID") || "anonymous"
let chatText = ""
const messages = []
let editedChatMessageUUID = null
let editedChatMessageText = ""

// filterText is split into tags by spaces and used to filter by a logical "and" to include displayed items
let filterText = ""

// hideText is split into tags by spaces and used to filter by a logical "OR" to hide displayed items
let hideText = ""

let sortMessagesByContent = false

let messagesDiv = null

const messagesByUUID = {}

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

function uuidv4() {
    // From: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
}

function sendChatMessage() {
    const timestamp = new Date().toISOString()
    const uuid = "chatMessage:" + uuidv4()

    const newMessage = { chatText, userID, timestamp, uuid }

    sendMessage({ chatText, userID, timestamp, uuid })
    chatText = ""
    if (!hasFilterText(newMessage)) {
        setTimeout(() => alert("The message you just added is currently\nnot displayed due to show/hide filtering."))
        /*
        filterText = ""
        hideText = "
        */
    }
    setTimeout(() => {
        // Scroll to bottom always when sending -- but defer it just in case was filtering
        if (messagesDiv) {
            messagesDiv.scrollTop = messagesDiv.scrollHeight
        }
    }, 0)
}

function sendMessage(message) {
    backend.addItem(message)
}

function sendEditedChatMessage() {
    const timestamp = new Date().toISOString()
    const uuid = editedChatMessageUUID

    sendMessage({ chatText: editedChatMessageText, userID, timestamp, uuid })
    editedChatMessageUUID = null
    editedChatMessageText = ""
}

function sendIfCtrlEnter(event, text, callbackToSendMessage) {
    if (text.trim() && event.key === "Enter" && event.ctrlKey ) {
        callbackToSendMessage()
        return false
    }
    event.redraw = false
    return true
}

function editedChatMessageKeyDown(event) {
    return sendIfCtrlEnter(event, editedChatMessageText, sendEditedChatMessage)
}

function textAreaKeyDown(event) {
    return sendIfCtrlEnter(event, chatText, sendChatMessage)
}

function formatChatMessage(text) {
    return m.trust(marked(text))
}

function getSortedMessages() {
    if (!sortMessagesByContent) return messages
    console.log("sorting messages")
    const sortedMessages = messages.slice()
    sortedMessages.sort((a, b) => {
        if (a.chatText < b.chatText) return -1
        if (a.chatText > b.chatText) return 1
        return 0
    })
    return sortedMessages
}

function hasFilterText(message) {
    if (message.chatText === "DELETED" && filterText !== "DELETED") return false
    const localMessageTimestamp = makeLocalMessageTimestamp(message.timestamp)
    if ((filterText || hideText) && typeof message.chatText === "string") {
        let lowerCaseText = message.chatText.toLowerCase() + " " + ("" + message.userID).toLowerCase() + " " + localMessageTimestamp.toLowerCase()

        if (filterText) {
            const tags = filterText.split(" ")
            for (let tag of tags) {
                if (tag && !lowerCaseText.includes(tag.toLowerCase())) return false
            }
        }
        if (hideText) {
            const tags = hideText.split(" ")
            for (let tag of tags) {
                if (tag && lowerCaseText.includes(tag.toLowerCase())) return false
            }
        }
    }

    return true
}

function exportChatClicked() {
    let text = ""

    getSortedMessages().forEach(function (message, index) {
        if (!hasFilterText(message)) return
        text += "\n----\n"
        text += "author: " + message.userID + " @ " + makeLocalMessageTimestamp(message.timestamp) + "\n"
        text += message.editedTimestamp ? "last edited: " + makeLocalMessageTimestamp(message.editedTimestamp) + "\n": ""
        text += "\n"
        text += message.chatText
    })

    FileUtils.saveToFile(chatRoom + " " + new Date().toISOString(), text, ".md")
}

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

        const upload = NotebookBackendUsingServer(m.redraw, {sha256: null}, userID)
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

function makeLocalMessageTimestamp(timestamp) {
    // Derived from: https://stackoverflow.com/questions/17415579/how-to-iso-8601-format-a-date-with-timezone-offset-in-javascript
    const date = new Date(Date.parse(timestamp))
    // const tzo = -date.getTimezoneOffset()
    // const dif = tzo >= 0 ? "+" : "-"
    const pad = function(num) {
        var norm = Math.floor(Math.abs(num))
        return (norm < 10 ? "0" : "") + norm
    }
    return date.getFullYear() +
        "-" + pad(date.getMonth() + 1) +
        "-" + pad(date.getDate()) +
        " " + pad(date.getHours()) +
        ":" + pad(date.getMinutes()) +
        ":" + pad(date.getSeconds())
    // + dif + pad(tzo / 60) +
    // ":" + pad(tzo % 60)
}

const TwirlipChat = {
    view: function () {
        return m("div.pa2.overflow-hidden.flex.flex-column.h-100.w-100", [
            // m("h4.tc", "Twirlip Chat"),
            m("div.mb3.f3.f6-l",
                m("span.dib.tr", "Twirlip chat room:"),
                m("input.w4.ml2", {value: chatRoom, onchange: chatRoomChange}),
                m("span.dib.tr.ml2", "User ID:"),
                m("input.w4.ml2", {value: userID, onchange: userIDChange, title: "Your user id or handle"}),
                m("a.pl2", {href: "https://github.github.com/gfm/", target: "_blank"}, "Markdown"),
                m("a.pl2", {href: "https://svg-edit.github.io/svgedit/releases/latest/editor/svg-editor.html", target: "_blank"}, "SVGEdit"),
                m("div.dib",
                    m("span.ml2" + (filterText ? ".green" : ""), "Show:"),
                    m("input.ml2" + (filterText ? ".green" : ""), {value: filterText, oninput: (event) => { filterText = event.target.value; scrollToBottomLater() }, title: "Only display messages with all entered words"}),
                    m("span.ml2" + (hideText ? ".orange" : ""), "Hide:"),
                    m("input.ml2" + (hideText ? ".orange" : ""), {value: hideText, oninput: (event) => { hideText = event.target.value; scrollToBottomLater() }, title: "Hide messages with any entered words"}),
                    m("span.ml2",  { title: "Sort alphabetically by chat message text" },
                        m("input[type=checkbox].ma1", { checked: sortMessagesByContent, onchange: (event) => sortMessagesByContent = event.target.checked }),
                        "sort"
                    )
                )
            ),
            m("div.overflow-auto.flex-auto",
                {
                    oncreate: (vnode) => {
                        messagesDiv = (vnode.dom)
                    },
                },
                getSortedMessages().map(function (message, index) {
                    if (!hasFilterText(message)) return []
                    return m("div.pa2.f2.f5-l", /* Causes ordering issue: {key: message.uuid || ("" + index)}, */ [
                        m("span.f4.f6-l",
                            m("i", message.userID + " @ " + makeLocalMessageTimestamp(message.timestamp)),
                            message.editedTimestamp ? m("b.ml1", {title: makeLocalMessageTimestamp(message.editedTimestamp) }, "edited")  : [],
                            // support editing
                            (message.userID === userID && message.uuid)
                                ? m("button.ml2", {
                                    onclick: () => {
                                        if (editedChatMessageUUID === message.uuid) {
                                            editedChatMessageUUID = null
                                        } else {
                                            editedChatMessageUUID = message.uuid || null
                                            editedChatMessageText = message.chatText
                                        }
                                    }}, "✎ edit")
                                : []),

                        editedChatMessageUUID === message.uuid
                            // if editing
                            ? m("div.ba.bw1.ma3.ml4.pa3",
                                m("textarea.h5.w-80.ma2.ml3", {value: editedChatMessageText, onkeydown: editedChatMessageKeyDown, oninput: (event) => editedChatMessageText = event.target.value}),
                                m("div",
                                    m("button.ml2.f3.mt2", {onclick: () => sendEditedChatMessage() }, "Update (ctrl-enter)"),
                                    m("button.ml2.f3.mt2", {onclick: () => editedChatMessageUUID = null}, "Cancel"),
                                ),
                            )
                            : m(".pl4.pr4", formatChatMessage(message.chatText))
                    ])
                })
            ),
            m("br"),
            m("div.pa3.f2.f5-l" + (editedChatMessageUUID ? ".dn" : ""),
                m("textarea.h4.w-80.ma2.ml3", {value: chatText, oninput: chatTextChange, onkeydown: textAreaKeyDown}),
                m("div",
                    m("button.ml2.f3.mt2", {onclick: sendChatMessage}, "Send (ctrl-enter)"),
                    m("button.ml2.f3.mt2", {onclick: uploadDocumentClicked}, "Upload document..."),
                    m("button.ml2.f3.mt2", {onclick: exportChatClicked}, "Export filtered chat as markdown..."),
                ),
            )
        ])
    }
}

let isLoaded = false

function scrollToBottomLater() {
    setTimeout(() => {
        // Scroll to bottom when loaded everything
        if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight
    }, 0)
}

const chatRoomResponder = {
    onLoaded: () => {
        isLoaded = true
        console.log("onLoaded")
        scrollToBottomLater()
    },
    addItem: (item, isAlreadyStored) => {
        console.log("addItem", item)
        let edited = false
        // Complexity needed to support editing
        if (messagesByUUID[item.uuid] === undefined) {
            if (item.uuid !== undefined) messagesByUUID[item.uuid] = messages.length
            messages.push(item)
        } else {
            if (messagesByUUID[item.uuid] !== undefined) {
                const previousVersion = messages[messagesByUUID[item.uuid]]
                console.log("message is edited", item, messagesByUUID[item.uuid])
                item.editedTimestamp = item.timestamp
                item.timestamp = previousVersion.timestamp
                messages[messagesByUUID[item.uuid]] = item
                edited = true
            }
        }
        if (isLoaded) {
            // Only scroll if scroll is already near bottom and not filtering or editing to avoid messing up editing or browsing previous items
            if (!filterText && !edited && messagesDiv && (messagesDiv.scrollTop >= (messagesDiv.scrollHeight - messagesDiv.clientHeight - 300))) {
                setTimeout(() => {
                    messagesDiv.scrollTop = messagesDiv.scrollHeight
                }, 0)
            }
            if (!document.hasFocus()) {
                // Notify the user about a new message in this window
                Push.create(item.userID + ": " + item.chatText, {timeout: 4000})
            }
        }
    }
}

startup()

const backend = NotebookBackendUsingServer(m.redraw, {chatRoom}, userID)

backend.connect(chatRoomResponder)
backend.setup(io)

m.mount(document.body, TwirlipChat)
