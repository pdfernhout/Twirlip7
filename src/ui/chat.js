"use strict"
/* global m */
/* eslint-disable no-console */

let chatRoom = "test"
let userID = "anonymous"
let chatText = ""
const messages = []

function chatRoomChange(event) {
    chatRoom = event.target.value
    // TODO: Other stuff for stream change
}

function userIDChange(event) {
    userID = event.target.value
    // TODO: Other stuff for userID change
}

function chatTextChange(event) {
    chatText = event.target.value
}

function sendChatMessage() {
    const timestamp = new Date().toISOString()
    const command = "insert"
    const streamId = {chatRoom}

    sendMessage({ command, streamId, chatText, userID, timestamp })
    chatText= ""
}

function sendMessage(message) {
    // TODO fix
    messages.push(message)
}

const TwirlipChat = {
    view: function () {
        return m("div", [
            m("h4.tc", "Twirlip Chat"),
            m("div.ma1",
                m("span.dib.tr.w4", "Chat room:"),
                m("input", {value: chatRoom, onchange: chatRoomChange})
            ),
            m("div.ma1",
                m("span.dib.tr.w4", "User ID:"),
                m("input", {value: userID, onchange: userIDChange})
            ),
            messages.map(function (message) {
                var localeTimestamp = new Date(Date.parse(message.timestamp)).toLocaleString()
                return m("div", [
                    m("span", {title: localeTimestamp, style: "font-size: 50%;"}, message.userID + ":"),
                    " ",
                    message.chatText
                ])
            }),
            m("br"),
            m("textarea", {value: chatText, onchange: chatTextChange}),
            m("button", {onclick: sendChatMessage}, "Send")
        ])
    }
}

window.onload = () => m.mount(document.body, TwirlipChat)
