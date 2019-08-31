/* eslint-disable no-console */

"use strict"

import { StreamBackendUsingServer } from "./StreamBackendUsingServer.js"
import { HashUtils } from "./HashUtils.js"
import { FileUtils } from "./FileUtils.js"

// defines m
import "./vendor/mithril.js"

let streamName1 = "{\"chatRoom\": \"sync-test\"}"
let streamName2 = ""

let serverURL1 = localStorage.getItem("synchronize-serverURL1") || ""
let serverURL2 = localStorage.getItem("synchronize-serverURL2") || ""

const messages1 = []
const messages2 = []

// filterText is split into tags by spaces and used to filter by a logical "and" to include displayed items
let filterText = ""

// hideText is split into tags by spaces and used to filter by a logical "OR" to hide displayed items
let hideText = ""

let messagesDiv1 = null
let messagesDiv2 = null

let messageToShow = null
let messageLabel = ""

function startup() {
    streamName1 = HashUtils.getHashParams()["stream"] || streamName1
    window.onhashchange = () => updateStreamNameFromHash()
    updateHashForStreamName()
}

function updateTitleForStreamName() {
    document.title = streamName1.replace(/[{}":]/g, "") + " -- Twirlip7 Synchronizer"
}

function updateStreamNameFromHash() {
    const hashParams = HashUtils.getHashParams()
    console.log("updateStreamNameFromHash", hashParams)
    const newStreamName = hashParams["stream"]
    if (newStreamName !== streamName1) {
        streamName1 = newStreamName
        resetMessagesForStreamNameChange1()
        updateTitleForStreamName()
        if (!isTextValidJSON(newStreamName)) {
            console.log("invalid JSON stream name in hash", newStreamName)
            return
        }
        backend1.configure(JSON.parse(streamName1))
    }
}

function updateHashForStreamName() {
    const hashParams = HashUtils.getHashParams()
    hashParams["stream"] = streamName1
    HashUtils.setHashParams(hashParams)
    updateTitleForStreamName()
}

function streamNameChange1(event) {
    resetMessagesForStreamNameChange1()
    streamName1 = event.target.value
    updateHashForStreamName()
    if (!isTextValidJSON(streamName1)) {
        console.log("invalid JSON stream name in hash", streamName1)
        return
    }
    backend1.configure(JSON.parse(streamName1))
    if (!streamName2) {
        resetMessagesForStreamNameChange2()
        backend2.configure(JSON.parse(streamName1))
    }
}

function streamNameChange2(event) {
    resetMessagesForStreamNameChange2()
    streamName2 = event.target.value
    // updateHashForStreamName()
    if (streamName2 && !isTextValidJSON(streamName2)) {
        console.log("invalid JSON stream name in hash", streamName2)
        return
    }
    backend2.configure(JSON.parse(streamName2 || streamName1))
}

function resetMessagesForStreamNameChange1() {
    messages1.splice(0)
}

function resetMessagesForStreamNameChange2() {
    messages2.splice(0)
}

function serverURLChange1(event) {
    serverURL1 = event.target.value
    // backend.configure(undefined, serverURL)
    localStorage.setItem("synchronize-serverURL1", serverURL1)
}

function serverURLChange2(event) {
    serverURL2 = event.target.value
    // backend.configure(undefined, serverURL)
    localStorage.setItem("synchronize-serverURL2", serverURL2)
}

function sendMessage(message) {
    // Call addItem after a delay to give socket.io a chance to reconnect
    // as socket.io will timeout if a prompt (or alert?) is up for very long
    setTimeout(() => backend1.addItem(message), 10)
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

function exportStreamAsJSONClicked() {
    const messagesToExport = []

    messages1.forEach(function (message, index) {
        if (!hasFilterText(message)) return
        messagesToExport.push(message)
    })

    FileUtils.saveToFile(streamName1 + " " + new Date().toISOString(), JSON.stringify(messagesToExport, null, 4), ".json")
}

function importStreamFromJSONClicked() {
    FileUtils.loadFromFile(false, (filename, contents, bytes) => {
        console.log("JSON filename, contents", filename, bytes, contents)
        for (let transaction of JSON.parse(contents)) {
            sendMessage(transaction)
        }
    })
}

function viewMessageList(messages) {
    return m("div",
        {
            oncreate: (vnode) => {
                // TODO: Improve brittle way to save node for scrolling
                if (messages === messages1) {
                    messagesDiv1 = (vnode.dom)
                } else {
                    messagesDiv2 = (vnode.dom)
                }
            },
        },
        messages.map(function (message, index) {
            if (!hasFilterText(message)) return []
            return m("div", [
                m("hr.b--light-gray"),
                m("div", "#" + index, m("button.ml2", {onclick: () => {
                    messageToShow = message
                    messageLabel = (messages === messages1 ? "A" : "B") + "#" + index
                }}, "Show")),
                m("pre", JSON.stringify(message, null, 4))
            ])
        })
    )
}

const TwirlipSynchronizer = {
    view: function () {
        return m("div.pa2.overflow-hidden.flex.flex-column.h-100.w-100", [
            m("h4.tc", "Twirlip Synchronizer"),
            m("div.mb3.center",
                m("div",
                    m("span.dib.tr.w3", "Server A"),
                    m("input.ml2.pl2", {style: "width: 30rem", value: serverURL1, onchange: serverURLChange1, title: "The first server URL"}),
                    m("span.dib.tr.w3.ml3", "Server B"),
                    m("input.ml2.pl2", {style: "width: 30rem", value: serverURL2, onchange: serverURLChange2, title: "The second server URL; leave blank for the one you are on"})
                ),
                m("div.mt1",
                    m("span.dib.tr.w3", "Stream A"),
                    m("input.ml2.pl2" + (!isTextValidJSON(streamName1) ? ".orange" : ""), {style: "width: 30rem", value: streamName1, onchange: streamNameChange1}),
                    m("span.dib.tr.w3.ml3", "Stream B"),
                    m("input.ml2.pl2" + (!isTextValidJSON(streamName2) ? ".orange" : ""), {style: "width: 30rem", value: streamName2, onchange: streamNameChange2, title: "The same as Stream A if left blank"})
                ),
                m("div.mt3",
                    m("div.ma3.center.w-60",
                        m("span.dib.tr.w3" + (filterText ? ".green" : ""), "Show"),
                        m("input.ml2.w5" + (filterText ? ".green" : ""), {value: filterText, oninput: (event) => { filterText = event.target.value; scrollToBottomLater() }, title: "Only display messages with all entered words"}),
                        m("span.dib.tr.w3" + (hideText ? ".orange" : ""), "Hide"),
                        m("input.ml2.w5" + (hideText ? ".orange" : ""), {value: hideText, oninput: (event) => { hideText = event.target.value; scrollToBottomLater() }, title: "Hide messages with any entered words"}),
                    )
                )
            ),
            m("div.overflow-auto.flex-auto.cf" + (messageToShow ? "" : ".dn"), 
                m("div", messageLabel, m("button.ml2", {onclick: () => messageToShow = null}, "Close X"),),
                m("pre", { style: "white-space: pre-wrap"}, JSON.stringify(messageToShow, null, 4))
            ),
            m("div.overflow-auto.flex-auto.cf" + (!messageToShow ? "" : ".dn"),
                m("div.fl.w-50.ba.overflow-hidden",
                    viewMessageList(messages1)
                ),
                m("div.fl.w-50.ba.overflow-hidden",
                    viewMessageList(messages2)
                )
            ),
            m("div",
                m("button.ml2.mt2", {onclick: exportStreamAsJSONClicked, title: "Export stream A as JSON"}, "Export JSON..."),
                m("button.ml2.mt2", {onclick: importStreamFromJSONClicked, title: "Import stream A from JSON"}, "Import JSON..."),                 
            ),
        ])
    }
}

let isLoaded = false

function scrollToBottomLater() {
    setTimeout(() => {
        // Scroll to bottom when loaded everything
        if (messagesDiv1) messagesDiv1.scrollTop = messagesDiv1.scrollHeight + 10000
        if (messagesDiv2) messagesDiv2.scrollTop = messagesDiv2.scrollHeight + 10000
    }, 0)
}

const streamNameResponder1 = {
    onLoaded: () => {
        isLoaded = true
        console.log("onLoaded")
        scrollToBottomLater()
    },
    addItem: (item, isAlreadyStored) => {
        // console.log("addItem", item)
        messages1.push(item)
        const itemIsNotFiltered = hasFilterText(item)
        if (isLoaded) {
            // Only scroll if scroll is already near bottom and not filtering to avoid messing up browsing previous items
            if (itemIsNotFiltered && messagesDiv1 && (messagesDiv1.scrollTop >= (messagesDiv1.scrollHeight - messagesDiv1.clientHeight - 300))) {
                setTimeout(() => {
                    // Add some because height may not include new item
                    messagesDiv1.scrollTop = messagesDiv1.scrollHeight + 10000
                }, 100)
            }
        }
    }
}
const streamNameResponder2 = {
    onLoaded: () => {
        isLoaded = true
        console.log("onLoaded")
        scrollToBottomLater()
    },
    addItem: (item, isAlreadyStored) => {
        // console.log("addItem", item)
        messages2.push(item)
        const itemIsNotFiltered = hasFilterText(item)
        if (isLoaded) {
            // Only scroll if scroll is already near bottom and not filtering to avoid messing up browsing previous items
            if (itemIsNotFiltered && messagesDiv2 && (messagesDiv2.scrollTop >= (messagesDiv2.scrollHeight - messagesDiv2.clientHeight - 300))) {
                setTimeout(() => {
                    // Add some because height may not include new item
                    messagesDiv2.scrollTop = messagesDiv2.scrollHeight + 10000
                }, 100)
            }
        }
    }
}


startup()

let initialObject = {}
try {
    initialObject = JSON.parse(streamName1)
} catch (e) {
    console.log("not valid JSON for hash", streamName1)
}
const backend1 = StreamBackendUsingServer(m.redraw, initialObject, undefined, serverURL1)

backend1.connect(streamNameResponder1)
try {
    backend1.setup()
} catch(e) {
    alert("This Synchronizer app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
}

try {
    initialObject = JSON.parse(streamName2 || streamName1)
} catch (e) {
    console.log("not valid JSON for hash", streamName1)
}
const backend2 = StreamBackendUsingServer(m.redraw, initialObject, undefined, serverURL2)

backend2.connect(streamNameResponder2)
try {
    backend2.setup()
} catch(e) {
    // alert("This Synchronizer app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
}

m.mount(document.body, TwirlipSynchronizer)
