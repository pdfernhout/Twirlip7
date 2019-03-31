/* global m */
/* eslint-disable no-console */

define(["/socket.io/socket.io.js", "NotebookBackendUsingServer", "vendor/mithril"], function(io, NotebookBackendUsingServer, mDiscard) {
    "use strict"

    console.log("NotebookBackendUsingServer", NotebookBackendUsingServer)

    let chatRoom = "test"
    let userID = "anonymous"
    let chatText = ""
    const messages = []

    let backend = NotebookBackendUsingServer({chatRoom}, userID)

    function chatRoomChange(event) {
        chatRoom = event.target.value
        messages.splice(0)
        backend.configure({chatRoom})
    }

    function userIDChange(event) {
        userID = event.target.value
        backend.configure(undefined, userID)
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
        // messages.push(message)
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
                m("textarea", {value: chatText, onchange: chatTextChange, onkeydown: textAreaKeyDown}),
                m("button", {onclick: sendChatMessage}, "Send")
            ])
        }
    }

    const responder = {
        onLoaded: () => console.log("onLoaded"),
        addItem: (item, isAlreadyStored) => {
            console.log("addItem", item)
            messages.push(item)
        }
    }

    backend.connect(responder)
    backend.setup(io)

    window.onload = () => m.mount(document.body, TwirlipChat)
})
