/* eslint-disable no-console */

"use strict"

import { StreamBackendUsingServer } from "./StreamBackendUsingServer.js"
import { HashUtils } from "./HashUtils.js"

// defines m
import "./vendor/mithril.js"

const ephemeralStreamPrefix = "__EPHEMERAL:"
const timeslice_ms = 100

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

let mediaRecorder

function setup() {
    if (!navigator.mediaDevices) {
        alert("media not supported in this browser")
        return
    }
    
    const constraints = { audio: true }
    return navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        mediaRecorder = new MediaRecorder(stream)
        mediaRecorder.ondataavailable = onRecorderData
        // mediaRecorder.onstop = onRecorderStop
        console.log("state", mediaRecorder.state)
        m.redraw()
    }).catch(function(err) {
        console.log("An error occurred: " + err)
    })
}

function recordClick() {
    mediaRecorder.start(timeslice_ms)
    console.log("recorder started")
    console.log("state", mediaRecorder.state)
}

function stopClick() {
    mediaRecorder.stop()
    console.log("recorder stopped")
    console.log("state", mediaRecorder.state)
}

// from: https://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
function arrayBufferToBase64( buffer ) {
    var binary = ""
    var bytes = new Uint8Array( buffer )
    var len = bytes.byteLength
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] )
    }
    return window.btoa( binary )
}

// From: https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
function base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64)
    var len = binary_string.length
    var bytes = new Uint8Array( len )
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes.buffer
}

async function onRecorderData(event) {
    const timestamp = new Date().toISOString()
    const buffer = await event.data.arrayBuffer()
    const newMessage = { timestamp, userID, audioChunk: {
        type: event.data.type,
        size: event.data.size,
        bytesBase64: arrayBufferToBase64(buffer)
    }}
    console.log(newMessage, event)
    sendMessage(newMessage)
    // m.redraw()
}

let audioURL

// TODO: buffering
// TODO: Mixing audio streams

// const messagesToPlay = []

async function playMessage(message) {
    const buffer = base64ToArrayBuffer(message.audioChunk.bytesBase64)
    console.log("buffer", buffer)
    const blob = new Blob([buffer], {type: message.audioChunk.type})
    console.log("made blob", blob)
    audioURL = URL.createObjectURL(blob)

    const element = document.getElementById("audioPlayer")
    // element.pause()
    element.src = audioURL
    /*
    try {
        const playResult = await element.play()
        console.log("playResult", playResult)
    } catch(e) {
        console.log("play error", e)
    }
    */
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
            mediaRecorder && m("div",
                m("audio#audioPlayer", {controls: false}),
                m("button", {onclick: () => {
                    const element = document.getElementById("audioPlayer")
                    if (element.paused) element.play()
                    isRecording = !isRecording
                    if (isRecording) {
                        recordClick()
                    } else {
                        stopClick()
                    }
                }}, isRecording ? "Push to mute" : "Push to talk")
            ),
            !mediaRecorder && "Starting up..."
        ])
    }
}

const streamNameResponder = {
    onLoaded: () => {
        console.log("onLoaded")
    },
    addItem: (item, isAlreadyStored) => {
        console.log("addItem", item)
        // if (item.userID !== userID)
        playMessage(item)
        // messagesToPlay.push(message)
        // messages.push(item)
    }
}

startup()
setup()

const backend = StreamBackendUsingServer(m.redraw, ephemeralStreamPrefix + streamNameSuffix, userID)

backend.connect(streamNameResponder)
try {
    backend.setup()
} catch(e) {
    alert("This Intercom app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
}

m.mount(document.body, TwirlipIntercom)
