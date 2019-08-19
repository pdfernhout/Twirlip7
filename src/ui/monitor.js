/* global m, io, marked, Push, sha256 */
/* eslint-disable no-console */

"use strict"

// Assumes socket.io loaded from script tag to define io

import { StreamBackendUsingServer } from "./StreamBackendUsingServer.js"
import { HashUtils } from "./HashUtils.js"

// defines m
import "./vendor/mithril.js"

let chatRoom = "test"
let userID = localStorage.getItem("userID") || "anonymous"
let chatText = ""
const messages = []

// filterText is split into tags by spaces and used to filter by a logical "and" to include displayed items
let filterText = ""

// hideText is split into tags by spaces and used to filter by a logical "OR" to hide displayed items
let hideText = ""

let messagesDiv = null

let messagesByUUID = {}

let showEntryArea = true

function startup() {
    chatRoom = HashUtils.getHashParams()["stream"] || chatRoom
    window.onhashchange = () => updateChatRoomFromHash()
    updateHashForChatRoom()
}

function updateTitleForChatRoom() {
    document.title = chatRoom + " -- Twirlip7 Monitor"
}

function updateChatRoomFromHash() {
    const hashParams = HashUtils.getHashParams()
    console.log("updateChatRoomFromHash", hashParams)
    const newChatRoom = hashParams["stream"]
    if (newChatRoom !== chatRoom) {
        resetMessagesForChatroomChange()
        chatRoom = newChatRoom
        backend.configure({chatRoom})
        updateTitleForChatRoom()
    }
}

function updateHashForChatRoom() {
    const hashParams = HashUtils.getHashParams()
    hashParams["stream"] = chatRoom
    HashUtils.setHashParams(hashParams)
    updateTitleForChatRoom()
}

function chatRoomChange(event) {
    resetMessagesForChatroomChange()
    chatRoom = event.target.value
    updateHashForChatRoom()
    backend.configure({chatRoom})
}

function resetMessagesForChatroomChange() {
    messages.splice(0)
    messagesByUUID = {}
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

    const newMessage = JSON.parse(chatText)

    sendMessage(newMessage)
    // chatText = ""
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
    if (isTextValidJSONObject(chatText) && text.trim() && event.key === "Enter" && event.ctrlKey ) {
        callbackToSendMessage()
        return false
    }
    event.redraw = false
    return true
}

function textAreaKeyDown(event) {
    return sendIfCtrlEnter(event, chatText, sendChatMessage)
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

function isTextValidJSONObject(text) {
    if (!chatText) return false
    if (text[0] !== "{") return false
    try {
        JSON.parse(text)
        return true
    } catch(e) {    
        return false
    }
}

const TwirlipChat = {
    view: function () {
        return m("div.pa2.overflow-hidden.flex.flex-column.h-100.w-100", [
            // m("h4.tc", "Twirlip Monitor"),
            m("div.mb3",
                m("span.dib.tr", "Space:"),
                m("input.w5.ml2", {value: chatRoom, onchange: chatRoomChange}),
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
                    m("button.ml2.mt2", {onclick: sendChatMessage, disabled: !isTextValidJSONObject(chatText)}, "Send (ctrl-enter)"),
                )                    
            ),
            showEntryArea && m("div.pb1.f4",
                m("textarea.h4.w-80.ma1.ml3", {value: chatText, oninput: chatTextChange, onkeydown: textAreaKeyDown}),
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

const chatRoomResponder = {
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

const backend = StreamBackendUsingServer(m.redraw, {chatRoom}, userID)

backend.connect(chatRoomResponder)
try {
    backend.setup(io)
} catch(e) {
    alert("This Monitor app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
}

m.mount(document.body, TwirlipChat)
