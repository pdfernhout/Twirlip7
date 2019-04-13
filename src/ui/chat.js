/* global m */
/* eslint-disable no-console */

define(["/socket.io/socket.io.js", "NotebookBackendUsingServer", "HashUtils", "vendor/push", "vendor/marked", "FileUtils", "vendor/mithril"], function(io, NotebookBackendUsingServer, HashUtils, Push, marked, FileUtils, mDiscard) {
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

    function upload() {
        FileUtils.loadFromFile(false, (name, contents) => {
            // console.log("result", name, contents)
            alert("upload unfinished: " + name)
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
                    m("a.pl2", {href: "https://github.github.com/gfm/"}, "Markdown documentation")
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
                    m("button.ml2", {onclick: upload}, "Upload..."),
                )
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
            if (!document.hasFocus()) {
                Push.create(item.userID + ": " + item.chatText)
            }
        }
    }

    startup()

    const backend = NotebookBackendUsingServer({chatRoom}, userID)

    backend.connect(responder)
    backend.setup(io)

    window.onload = () => m.mount(document.body, TwirlipChat)
})
