/* global m */
/* eslint-disable no-console */

define(["/socket.io/socket.io.js", "NotebookBackendUsingServer", "HashUtils", "vendor/mithril"], function(io, NotebookBackendUsingServer, HashUtils, mDiscard) {
    "use strict"

    console.log("NotebookBackendUsingServer", NotebookBackendUsingServer)

    let chatRoom = "test"
    let userID = "anonymous"
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

    const TwirlipChat = {
        view: function () {
            return m("div..pa2.overflow-hidden.flex.flex-column.h-100.w-100", [
                m("h4.tc", "Twirlip Chat"),
                m("div.ma1",
                    m("span.dib.tr.w4", "Chat room:"),
                    m("input", {value: chatRoom, onchange: chatRoomChange})
                ),
                m("div.ma1",
                    m("span.dib.tr.w4", "User ID:"),
                    m("input", {value: userID, onchange: userIDChange})
                ),
                m("div.overflow-auto.flex-auto",
                    {
                        oncreate: (vnode) => {
                            messagesDiv = (vnode.dom)
                        },
                    },
                    messages.map(function (message) {
                        var localeTimestamp = new Date(Date.parse(message.timestamp)).toLocaleString()
                        return m("div", [
                            m("span", {title: localeTimestamp, style: "font-size: 50%;"}, message.userID + ":"),
                            " ",
                            message.chatText
                        ])
                    })
                ),
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
            setTimeout(() => {
                messagesDiv.scrollTop = messagesDiv.scrollHeight
            }, 0)
        }
    }

    startup()

    const backend = NotebookBackendUsingServer({chatRoom}, userID)

    backend.connect(responder)
    backend.setup(io)

    window.onload = () => m.mount(document.body, TwirlipChat)
})
