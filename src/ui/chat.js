/* global marked, Push */
/* eslint-disable no-console */

"use strict"

import { StoreUsingServer } from "./StoreUsingServer.js"
import { HashUtils } from "./HashUtils.js"
import { FileUtils } from "./FileUtils.js"
import { FileUploader } from "./FileUploader.js"
import { UUID } from "./UUID.js"
import { Toast } from "./Toast.js"

// defines marked
import "./vendor/marked.js"

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

let messagesByUUID = {}

let entryAreaPosition = "right"
const entryAreaPositionChoices = ["none", "right", "bottom", "top", "left"]

function startup() {
    chatRoom = HashUtils.getHashParams()["chatRoom"] || chatRoom
    window.onhashchange = () => updateChatRoomFromHash()
    updateHashForChatRoom()
}

function updateTitleForChatRoom() {
    document.title = chatRoom + " -- Twirlip7 Chat"
}

function updateChatRoomFromHash() {
    const hashParams = HashUtils.getHashParams()
    console.log("updateChatRoomFromHash", hashParams)
    const newChatRoom = hashParams["chatRoom"]
    if (newChatRoom !== chatRoom) {
        resetMessagesForChatroomChange()
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
    const timestamp = new Date().toISOString()
    const uuid = "chatMessage:" + UUID.uuidv4()

    const newMessage = { chatText, userID, timestamp, uuid }

    sendMessage({ chatText, userID, timestamp, uuid })
    chatText = ""
    if (!hasFilterText(newMessage)) {
        Toast.toast("The message you just added is currently\nnot displayed due to show/hide filtering.")
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
    return m.trust(marked.marked(text))
}

function getSortedMessages() {
    if (!sortMessagesByContent) return messages
    // console.log("sorting messages")
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

function exportChatAsMarkdownClicked() {
    let text = ""

    getSortedMessages().forEach(function (message, index) {
        if (!hasFilterText(message)) return
        text += "\n----\n"
        text += "author: " + message.userID + " " + makeLocalMessageTimestamp(message.timestamp) + "\n"
        text += message.editedTimestamp ? "last edited: " + makeLocalMessageTimestamp(message.editedTimestamp) + "\n": ""
        text += "\n"
        text += message.chatText
    })

    FileUtils.saveToFile(chatRoom + " " + new Date().toISOString(), text, ".md")
}

function exportChatAsJSONClicked() {
    const messagesToExport = []

    getSortedMessages().forEach(function (message, index) {
        if (!hasFilterText(message)) return
        messagesToExport.push(message)
    })

    FileUtils.saveToFile(chatRoom + " " + new Date().toISOString(), JSON.stringify(messagesToExport, null, 4), ".json")
}

function importChatFromJSONClicked() {
    FileUtils.loadFromFile(false, (filename, contents, bytes) => {
        console.log("JSON filename, contents", filename, bytes, contents)
    })
}

let isUploading = false

function uploadDocumentClicked() {
    FileUtils.loadFromFile(true, async (filename, contents, bytes) => {
        // console.log("loadFromFile result", filename, contents, bytes)
        isUploading = true
        m.redraw()

        let uploadResult
        try {
            uploadResult = await FileUploader.upload(backend, userID, filename, contents, bytes)
        } catch (error) {
            console.log("upload error", error)
            isUploading = false
            Toast.toast("Upload failed")
            return
        }

        // console.log("uploadResult", uploadResult)

        isUploading = false
        
        let textToAdd = `[${filename}](${uploadResult.url})`
        // Format as markdown image if it might be an image
        if (uploadResult.isImageFile) textToAdd = `![${filename}](${uploadResult.url} "${filename}")`

        if (chatText) chatText += ""
        chatText += textToAdd

        if (uploadResult.existed) {
            Toast.toast("Upload already existed")
        } else {
            Toast.toast("Uploaded " + uploadResult.filename)
        }

        m.redraw()
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

function viewNavigation() {
    return [
        m("span.dib.tr", "Space:"),
        m("input.w5.ml2", {value: chatRoom, onchange: chatRoomChange}),
        m("span.dib.tr.ml2", "User:"),
        m("input.w4.ml2", {value: userID, onchange: userIDChange, title: "Your user id or handle"}),
        m("div.dib",
            m("span.ml2" + (filterText ? ".green" : ""), "Show:"),
            m("input.ml2" + (filterText ? ".green" : ""), {value: filterText, oninput: (event) => { filterText = event.target.value; scrollToBottomLater() }, title: "Only display messages with all entered words"}),
            m("span.ml2" + (hideText ? ".orange" : ""), "Hide:"),
            m("input.ml2" + (hideText ? ".orange" : ""), {value: hideText, oninput: (event) => { hideText = event.target.value; scrollToBottomLater() }, title: "Hide messages with any entered words"}),
            m("span.ml2",  { title: "Sort alphabetically by chat message text" },
                m("input[type=checkbox].ma1", { checked: sortMessagesByContent, onchange: (event) => sortMessagesByContent = event.target.checked }),
                "sort"
            )
        ),
    ]
}

function viewMessages() {
    return getSortedMessages().map(function (message, index) {
        if (!hasFilterText(message)) return []
        return m("div", /* Causes ordering issue: {key: message.uuid || ("" + index)}, */ [
            m("hr.b--light-gray"),
            m("span",
                m("i", makeLocalMessageTimestamp(message.timestamp) + " " + message.userID),
                (message.previousVersion)
                    ? m("span.ml2", {
                        title: "show history in console",
                        onclick: () => {
                            let messageVersion = message
                            while (messageVersion) {
                                console.log("messageVersion", messageVersion)
                                messageVersion = messageVersion.previousVersion
                            }
                            Toast.toast("History of message put in console")
                        }}, "⌚")
                    : [],
                message.editedTimestamp ? m("b.ml1", {title: makeLocalMessageTimestamp(message.editedTimestamp) }, "edited")  : [],
                // support editing
                (message.userID === userID && message.uuid)
                    ? m("span.ml2", {
                        title: "edit",
                        onclick: () => {
                            if (editedChatMessageUUID === message.uuid) {
                                editedChatMessageUUID = null
                            } else {
                                editedChatMessageUUID = message.uuid || null
                                editedChatMessageText = message.chatText
                            }
                        }}, "✎")
                    : []),
            editedChatMessageUUID === message.uuid
                // if editing
                ? m("div.ba.bw1.ma3.ml4.pa3",
                    m("textarea.h5.w-80.ma2.ml3.f4", {value: editedChatMessageText, onkeydown: editedChatMessageKeyDown, oninput: (event) => editedChatMessageText = event.target.value}),
                    m("div",
                        m("button.ml2.mt2", {onclick: () => sendEditedChatMessage() }, "Update (ctrl-enter)"),
                        m("button.ml2.mt2", {onclick: () => editedChatMessageUUID = null}, "Cancel"),
                    ),
                )
                : m(".pl4.pr4", formatChatMessage(message.chatText))
        ])
    })
}

function viewEntryAreaPositionChoice() {
    return m("span.ml2",  { title: "Show entry area" },
        m("select", {onchange: event => entryAreaPosition = event.target.value},
            entryAreaPositionChoices.map(key => {
                return m("option", {value: key, selected: entryAreaPosition === key}, "entry area: " + key)
            })
        )
    )
}

function viewEntryLine() {
    return m("div",
        viewEntryAreaPositionChoice(),
        m("span.w-80", 
            m("input.ml2.w-70", {value: chatText, oninput: chatTextChange, onkeydown: textAreaKeyDown}),
            m("button.ml2.mt2.w-10", {onclick: sendChatMessage, title: "Ctrl-Enter to send"}, "Send"),
        )
    )
}

function viewEntryAreaTools() {
    return m("div.dib",
        viewEntryAreaPositionChoice(),
        m("a.pl2", {href: "https://github.github.com/gfm/", target: "_blank"}, "Markdown"),
        m("a.pl2", {href: "https://svg-edit.github.io/svgedit/releases/latest/editor/svg-editor.html", target: "_blank"}, "SVGEdit"),
        m("button.ml2.mt2", {onclick: sendChatMessage}, "Send (ctrl-enter)"),
        m("button.ml2.mt2", {onclick: uploadDocumentClicked}, m("i.fa.mr1" + (isUploading ? ".fa-refresh.fa-spin" : ".fa-upload")), "Upload document..."),
        m("button.ml2.mt2", {onclick: exportChatAsMarkdownClicked, title: "Export filtered chat as Markdown"}, "Export Markdown..."),
        m("button.ml2.mt2", {onclick: exportChatAsJSONClicked, title: "Export filtered chat as JSON"}, "Export JSON..."),
        m("button.ml2.mt2", {onclick: importChatFromJSONClicked, title: "Import chat messages from JSON"}, "Import JSON..."),
    )
}

function viewEntryArea() {
    return m("div.pb1.f4" + (editedChatMessageUUID ? ".dn" : ""),
        m("textarea.h4.w-80.ma1.ml2", {value: chatText, oninput: chatTextChange, onkeydown: textAreaKeyDown}),
    )
}

const TwirlipChat = {
    view: function () {
        return m("div.flex.flex-row.h-100.w-100",
            (entryAreaPosition === "left") && m("div.ma2",
                viewEntryAreaTools(),
                viewEntryArea()
            ),
            m("div.pa2.overflow-hidden.flex.flex-column.h-100.w-100", [
                Toast.viewToast(),
                m("div.mb3",
                    viewNavigation()
                ),
                (entryAreaPosition === "top") && viewEntryAreaTools(),                  
                (entryAreaPosition === "top") && viewEntryArea(),
                m("div.overflow-auto.flex-auto",
                    {
                        oncreate: (vnode) => {
                            messagesDiv = (vnode.dom)
                        },
                    },
                    viewMessages(),
                ),
                (entryAreaPosition === "none") && viewEntryLine(),
                (entryAreaPosition === "bottom") && viewEntryAreaTools(),                  
                (entryAreaPosition === "bottom") && viewEntryArea()
            ]),
            (entryAreaPosition === "right") && m("div.ma2",
                viewEntryAreaTools(),
                viewEntryArea()
            )
        )
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
    onAddItem: (item) => {
        // console.log("onAddItem", item)
        let edited = false
        // Complexity needed to support editing
        if (messagesByUUID[item.uuid] === undefined) {
            if (item.uuid !== undefined) messagesByUUID[item.uuid] = messages.length
            messages.push(item)
        } else {
            if (messagesByUUID[item.uuid] !== undefined) {
                const previousVersion = messages[messagesByUUID[item.uuid]]
                // console.log("message is edited", item, messagesByUUID[item.uuid])
                item.editedTimestamp = item.timestamp
                item.timestamp = previousVersion.timestamp
                messages[messagesByUUID[item.uuid]] = item
                edited = true
                item.previousVersion = previousVersion
            }
        }
        const itemIsNotFiltered = hasFilterText(item)
        if (isLoaded) {
            // Only scroll if scroll is already near bottom and not filtering or editing to avoid messing up editing or browsing previous items
            if (itemIsNotFiltered && !edited && messagesDiv && (item.userID === userID || messagesDiv.scrollTop >= (messagesDiv.scrollHeight - messagesDiv.clientHeight - 300))) {
                setTimeout(() => {
                    // Add some because height may not include new item
                    messagesDiv.scrollTop = messagesDiv.scrollHeight + 10000
                }, 100)
            }
            if (!document.hasFocus()) {
                // Notify the user about a new message in this window
                Push.create(item.userID + ": " + item.chatText, {timeout: 4000})
            }
        }
    }
}

startup()

const backend = StoreUsingServer(m.redraw, {chatRoom}, userID)

backend.connect(chatRoomResponder)
try {
    backend.setup()
} catch(e) {
    alert("This Chat app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
}

m.mount(document.body, TwirlipChat)
