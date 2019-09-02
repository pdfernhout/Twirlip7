/* eslint-disable no-console */

"use strict"

import { StreamBackendUsingServer } from "./StreamBackendUsingServer.js"
import { HashUtils } from "./HashUtils.js"

// defines m
import "./vendor/mithril.js"

const ephemeralStreamPrefix = "__EPHEMERAL:"

let streamNameSuffix = "test"
let userID = localStorage.getItem("userID") || "anonymous"
const messages = []

let isRecording = false

function startup() {
    streamNameSuffix = HashUtils.getHashParams()["channel"] || streamNameSuffix
    window.onhashchange = () => updateStreamNameFromHash()
    updateHashForStreamName()
}

function updateTitleForStreamName() {
    document.title = streamNameSuffix.replace(/[{}":]/g, "") + " -- Twirlip7 Monitor"
}

function updateStreamNameFromHash() {
    const hashParams = HashUtils.getHashParams()
    console.log("updateStreamNameFromHash", hashParams)
    const newStreamName = hashParams["stream"]
    if (newStreamName !== streamNameSuffix) {
        streamNameSuffix = newStreamName
        resetMessagesForStreamNameChange()
        updateTitleForStreamName()
        backend.configure(ephemeralStreamPrefix + streamNameSuffix)
    }
}

function updateHashForStreamName() {
    const hashParams = HashUtils.getHashParams()
    hashParams["stream"] = streamNameSuffix
    HashUtils.setHashParams(hashParams)
    updateTitleForStreamName()
}

function streamNameChange(event) {
    resetMessagesForStreamNameChange()
    streamNameSuffix = event.target.value
    updateHashForStreamName()
    backend.configure(ephemeralStreamPrefix + streamNameSuffix)
}

function resetMessagesForStreamNameChange() {
    messages.splice(0)
}

function userIDChange(event) {
    userID = event.target.value
    backend.configure(undefined, userID)
    localStorage.setItem("userID", userID)
}

function sendMessage(message) {
    backend.addItem(message)
}

const TwirlipIntercom = {
    view: function () {
        return m("div.pa2.overflow-hidden.flex.flex-column.h-100.w-100", [
            m("h4", "Twirlip Intercom"),
            m("div.mb3",
                m("span.dib.tr", "Stream:"),
                m("input.ml2", {style: "width: 30rem", value: streamNameSuffix, onchange: streamNameChange}),
                m("span.dib.tr.ml2", "User:"),
                m("input.w4.ml2", {value: userID, onchange: userIDChange, title: "Your user id or handle"}),
            ),
            m("div",
                m("button", {onclick: () => isRecording = !isRecording}, isRecording ? "Push to mute" : "Push to talk")
            )
        ])
    }
}

const streamNameResponder = {
    onLoaded: () => {
        console.log("onLoaded")
    },
    addItem: (item, isAlreadyStored) => {
        // console.log("addItem", item)
        messages.push(item)
    }
}

startup()

const backend = StreamBackendUsingServer(m.redraw, ephemeralStreamPrefix + streamNameSuffix, userID)

backend.connect(streamNameResponder)
try {
    backend.setup()
} catch(e) {
    alert("This Intercom app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
}

m.mount(document.body, TwirlipIntercom)
