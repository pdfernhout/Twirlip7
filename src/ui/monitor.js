/* global m, io, marked, Push, sha256 */
/* eslint-disable no-console */

"use strict"

// Assumes socket.io loaded from script tag to define io

import { StreamBackendUsingServer } from "./StreamBackendUsingServer.js"
import { HashUtils } from "./HashUtils.js"
import { FileUtils } from "./FileUtils.js"

// defines m
import "./vendor/mithril.js"

let streamName = "{\"chatRoom\": \"test\"}"
let userID = localStorage.getItem("userID") || "anonymous"
let newMessageJSONText = ""
const messages = []

// filterText is split into tags by spaces and used to filter by a logical "and" to include displayed items
let filterText = ""

// hideText is split into tags by spaces and used to filter by a logical "OR" to hide displayed items
let hideText = ""

let messagesDiv = null

let showEntryArea = false

function startup() {
    streamName = HashUtils.getHashParams()["stream"] || streamName
    window.onhashchange = () => updateStreamNameFromHash()
    updateHashForStreamName()
}

function updateTitleForStreamName() {
    document.title = streamName.replace(/[{}":]/g, "") + " -- Twirlip7 Monitor"
}

function updateStreamNameFromHash() {
    const hashParams = HashUtils.getHashParams()
    console.log("updateStreamNameFromHash", hashParams)
    const newStreamName = hashParams["stream"]
    if (newStreamName !== streamName) {
        streamName = newStreamName
        resetMessagesForStreamNameChange()
        updateTitleForStreamName()
        if (!isTextValidJSON(newStreamName)) {
            console.log("invalid JSON stream name in hash", newStreamName)
            return
        }
        backend.configure(JSON.parse(streamName))
    }
}

function updateHashForStreamName() {
    const hashParams = HashUtils.getHashParams()
    hashParams["stream"] = streamName
    HashUtils.setHashParams(hashParams)
    updateTitleForStreamName()
}

function streamNameChange(event) {
    resetMessagesForStreamNameChange()
    streamName = event.target.value
    updateHashForStreamName()
    if (!isTextValidJSON(streamName)) {
        console.log("invalid JSON stream name in hash", streamName)
        return
    }
    backend.configure(JSON.parse(streamName))
}

function resetMessagesForStreamNameChange() {
    messages.splice(0)
}

function userIDChange(event) {
    userID = event.target.value
    backend.configure(undefined, userID)
    localStorage.setItem("userID", userID)
}

function newMessageJSONTextChange(event) {
    newMessageJSONText = event.target.value
}

function sendStreamMessage() {

    const newMessage = JSON.parse(newMessageJSONText)

    sendMessage(newMessage)
    // newMessageJSONText = ""
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
    // Call addItem after a delay to give socket.io a chance to reconnect
    // as socket.io will timeout if a prompt (or alert?) is up for very long
    setTimeout(() => backend.addItem(message), 10)
}

function sendIfCtrlEnter(event, text, callbackToSendMessage) {
    if (isTextValidJSONObject(newMessageJSONText) && text.trim() && event.key === "Enter" && event.ctrlKey ) {
        callbackToSendMessage()
        return false
    }
    event.redraw = false
    return true
}

function textAreaKeyDown(event) {
    return sendIfCtrlEnter(event, newMessageJSONText, sendStreamMessage)
}

function hasFilterText(message) {
    const messageText = JSON.stringify(message)

    if ((filterText || hideText)) {
        let lowerCaseText = messageText

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

function isTextValidJSON(text) {
    if (!text) return false
    try {
        JSON.parse(text)
        return true
    } catch(e) {    
        return false
    }
}

function isTextValidJSONObject(text) {
    if (text[0] !== "{") return false
    return isTextValidJSON(text)
}

function exportStreamAsJSONClicked() {
    const messagesToExport = []

    messages.forEach(function (message, index) {
        if (!hasFilterText(message)) return
        messagesToExport.push(message)
    })

    FileUtils.saveToFile(streamName + " " + new Date().toISOString(), JSON.stringify(messagesToExport, null, 4), ".json")
}

function importStreamFromJSONClicked() {
    FileUtils.loadFromFile(false, (filename, contents, bytes) => {
        console.log("JSON filename, contents", filename, bytes, contents)
        for (let transaction of JSON.parse(contents)) {
            sendMessage(transaction)
        }
    })
}

const TwirlipMonitor = {
    view: function () {
        return m("div.pa2.overflow-hidden.flex.flex-column.h-100.w-100", [
            // m("h4.tc", "Twirlip Monitor"),
            m("div.mb3",
                m("span.dib.tr", "Stream:"),
                m("input.ml2" + (!isTextValidJSON(streamName) ? ".orange" : ""), {style: "width: 30rem", value: streamName, onchange: streamNameChange}),
                m("span.dib.tr.ml2", "User:"),
                m("input.w4.ml2", {value: userID, onchange: userIDChange, title: "Your user id or handle"}),
                m("div.dib",
                    m("span.ml2" + (filterText ? ".green" : ""), "Show:"),
                    m("input.ml2" + (filterText ? ".green" : ""), {value: filterText, oninput: (event) => { filterText = event.target.value; scrollToBottomLater() }, title: "Only display messages with all entered words"}),
                    m("span.ml2" + (hideText ? ".orange" : ""), "Hide:"),
                    m("input.ml2" + (hideText ? ".orange" : ""), {value: hideText, oninput: (event) => { hideText = event.target.value; scrollToBottomLater() }, title: "Hide messages with any entered words"}),
                ),
            ),
            m("div.overflow-auto.flex-auto",
                {
                    oncreate: (vnode) => {
                        messagesDiv = (vnode.dom)
                    },
                },
                messages.map(function (message, index) {
                    if (!hasFilterText(message)) return []
                    return m("div", [
                        m("hr.b--light-gray"),
                        m("div", "#" + index),
                        m("pre", JSON.stringify(message, null, 4))
                    ])
                })
            ),
            m("div",
                m("span.ml2",  { title: "Show entry area" },
                    m("input[type=checkbox].ma1", { checked: showEntryArea, onchange: (event) => showEntryArea = event.target.checked }),
                    "entry area"
                ),
                showEntryArea && m("div.dib",
                    m("button.ml2.mt2", {onclick: sendStreamMessage, disabled: !isTextValidJSONObject(newMessageJSONText)}, "Send (ctrl-enter)"),
                    m("span.ml2", "Enter a valid JSON object {...} below:"),
                    m("button.ml2.mt2", {onclick: exportStreamAsJSONClicked, title: "Export stream as JSON"}, "Export JSON..."),
                    m("button.ml2.mt2", {onclick: importStreamFromJSONClicked, title: "Import stream from JSON"}, "Import JSON..."),
                )                    
            ),
            showEntryArea && m("div.pb1.f4",
                m("textarea.h4.w-80.ma1.ml3", {value: newMessageJSONText, oninput: newMessageJSONTextChange, onkeydown: textAreaKeyDown}),
            )
        ])
    }
}

let isLoaded = false

function scrollToBottomLater() {
    setTimeout(() => {
        // Scroll to bottom when loaded everything
        if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight + 10000
    }, 0)
}

const streamNameResponder = {
    onLoaded: () => {
        isLoaded = true
        console.log("onLoaded")
        scrollToBottomLater()
    },
    addItem: (item, isAlreadyStored) => {
        // console.log("addItem", item)
        messages.push(item)
        const itemIsNotFiltered = hasFilterText(item)
        if (isLoaded) {
            // Only scroll if scroll is already near bottom and not filtering to avoid messing up browsing previous items
            if (itemIsNotFiltered && messagesDiv && (item.userID === userID || messagesDiv.scrollTop >= (messagesDiv.scrollHeight - messagesDiv.clientHeight - 300))) {
                setTimeout(() => {
                    // Add some because height may not include new item
                    messagesDiv.scrollTop = messagesDiv.scrollHeight + 10000
                }, 100)
            }
        }
    }
}

startup()

let initialObject = {}
try {
    initialObject = JSON.parse(streamName)
} catch (e) {
    console.log("not valid JSON for hash", streamName)
}
const backend = StreamBackendUsingServer(m.redraw, initialObject, userID)

backend.connect(streamNameResponder)
try {
    backend.setup(io)
} catch(e) {
    alert("This Monitor app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
}

m.mount(document.body, TwirlipMonitor)
