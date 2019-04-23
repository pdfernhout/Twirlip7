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

console.log("NotebookBackendUsingServer", NotebookBackendUsingServer)

let chatRoom = "test"
let userID = localStorage.getItem("userID") || "anonymous"
let chatText = ""
const messages = []
let editedChatMessageUUID = null
let editedChatMessageText = ""

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

    sendMessage({ chatText, userID, timestamp, uuid })
    chatText= ""
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

function textAreaKeyDown(event) {
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
            m("div.mb3.f3.f6-l",
                m("span.dib.tr", "Twirlip chat room:"),
                m("input.w4.ml2", {value: chatRoom, onchange: chatRoomChange}),
                m("span.dib.tr.ml2", "User ID:"),
                m("input.w4.ml2", {value: userID, onchange: userIDChange}),
                m("a.pl2", {href: "https://github.github.com/gfm/", target: "_blank"}, "Markdown")
            ),
            m("div.overflow-auto.flex-auto",
                {
                    oncreate: (vnode) => {
                        messagesDiv = (vnode.dom)
                    },
                },
                messages.map(function (message) {
                    var localeTimestamp = new Date(Date.parse(message.timestamp)).toLocaleString()
                    return m("div.pa2.f2.f5-l", [
                        m("span.f4.f6-l", {title: localeTimestamp, style: "font-size: 80%;"},
                            m("i", message.userID + " @ " + localeTimestamp),
                            message.editedTimestamp ? m("b.ml1", {title: new Date(Date.parse(message.editedTimestamp)).toLocaleString() }, "edited")  : [],
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
                                m("textarea.h5.w-80.ma2.ml3", {value: editedChatMessageText, onchange: (event) => editedChatMessageText = event.target.value}),
                                m("div",
                                    m("button.ml2.f3.mt2", {onclick: () => sendEditedChatMessage() }, "Update"),
                                    m("button.ml2.f3.mt2", {onclick: () => editedChatMessageUUID = null}, "Cancel"),
                                ),
                            )
                            : m(".pl4.pr4", formatChatMessage(message.chatText))
                    ])
                })
            ),
            m("br"),
            m("div.pa3.f2.f5-l" + (editedChatMessageUUID ? ".dn" : ""),
                m("textarea.h4.w-80.ma2.ml3", {value: chatText, onchange: chatTextChange, onkeydown: textAreaKeyDown}),
                m("div",
                    m("button.ml2.f3.mt2", {onclick: sendChatMessage}, "Send"),
                    m("button.ml2.f3.mt2", {onclick: uploadClicked}, "Upload..."),
                ),
            )
        ])
    }
}

const chatRoomResponder = {
    onLoaded: () => console.log("onLoaded"),
    addItem: (item, isAlreadyStored) => {
        console.log("addItem", item)
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
            }
        }
        setTimeout(() => {
            if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight
        }, 0)
        if (!document.hasFocus()) {
            Push.create(item.userID + ": " + item.chatText)
        }
    }
}

startup()

const backend = NotebookBackendUsingServer(m.redraw, {chatRoom}, userID)

backend.connect(chatRoomResponder)
backend.setup(io)

m.mount(document.body, TwirlipChat)
