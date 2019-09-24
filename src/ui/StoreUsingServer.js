"use strict"

// Assumes socket.io loaded from script tag to define io
/* global io */

import { CanonicalJSON } from "./CanonicalJSON.js"
import { UUID } from "./UUID.js"

// returns position + 1 for item reference to avoid first item being "0"
export function StoreUsingServer(redrawCallback, streamId = "common", userId = "anonymous", serverURL = "") {
    let socket = null
    let messagesReceivedCount = 0
    let responder = null
    const listeningOnStreams = {}
    const loadedStreams = {}
    const echoPromises = {}

    streamId = JSON.parse(CanonicalJSON.stringify(streamId))

    // alternateStreamId is optional
    function addItem(item, alternateStreamId) {
        sendInsertItemMessage(item, alternateStreamId)
    }

    async function addItemAsync(item, alternateStreamId) {
        await sendInsertItemMessageAsync(item, alternateStreamId)
    }

    async function getStreamStatusAsync(alternateStreamId) {
        // console.log("getStreamStatusAsync", alternateStreamId)
        const message = {command: "streamStatus", streamId: alternateStreamId}
        sendMessage(message)
        // sendMessage will add a uuid to the message
        const promise = new Promise((resolve, reject) => {
            echoPromises[message.uuid] = {resolve, reject}
        })
        return promise
    }

    // =============== socket.io communications

    function sendMessage(message) {
        // Modify message to have userId, timestamp, and uuid
        Object.assign(message, {userId: userId, timestamp: new Date().toISOString(), uuid: UUID.uuidv4()})
        // console.log("sendMessage", message)
        socket.emit("twirlip", message)
    }

    // alternateStreamId is optional
    function sendInsertItemMessage(item, alternateStreamId) {
        if (alternateStreamId !== undefined) alternateStreamId = JSON.parse(CanonicalJSON.stringify(alternateStreamId))
        const message = {command: "insert", streamId: alternateStreamId || streamId, item: item}
        sendMessage(message)
    }

    // This can be used to ensure a message was processed by the backend
    async function sendInsertItemMessageAsync(item, alternateStreamId) {
        if (alternateStreamId !== undefined) alternateStreamId = JSON.parse(CanonicalJSON.stringify(alternateStreamId))
        const message = {command: "insert", streamId: alternateStreamId || streamId, item: item}
        sendMessage(message)
        // sendMessage will add a uuid to the message
        const promise = new Promise((resolve, reject) => {
            echoPromises[message.uuid] = {resolve, reject}
        })
        return promise
    }

    function requestAllMessages() {
        console.log("requestAllMessages", messagesReceivedCount)
        listeningOnStreams[CanonicalJSON.stringify(streamId)] = true
        sendMessage({command: "listen", streamId: streamId, fromIndex: messagesReceivedCount})
    }

    function areAllStreamsLoaded() {
        for (let key of Object.keys(listeningOnStreams)) {
            if (!loadedStreams[key]) return false
        }
        return true
    }

    function isMatchingStreamId(a, b) {
        // TODO: Optimize
        return CanonicalJSON.stringify(a) === CanonicalJSON.stringify(b)
    }

    function messageReceived(message) {
        // console.log("messageReceived", message)
        if (message.command === "insert" || message.command === "ack-insert") {
            // messages may be ack-ed instead of inserted (echoed) if the client 
            // who sent them is not currently listening on the streamId they were for
            if (isMatchingStreamId(message.streamId, streamId)) messagesReceivedCount++
            if (message.command === "insert") responder.onAddItem(message.item)

            // Notify someone waiting for an echo or ack of the message they sent
            // This can be used to ensure a message was processed by the backend
            const promiseResolver = echoPromises[message.uuid]
            if (promiseResolver) {
                promiseResolver.resolve()
                delete echoPromises[message.uuid]
            }
        } else if (message.command === "remove") {
            if (isMatchingStreamId(message.streamId, streamId)) messagesReceivedCount++
            console.log("TODO: Remove message not handled")
        } else if (message.command === "reset") {
            if (isMatchingStreamId(message.streamId, streamId)) messagesReceivedCount++
            // TODO: Should handle timestamps somehow, so earlier messages before last reset are rejected
            // clearItems()
            console.log("TODO: clear items not handled")
        } else if (message.command === "loaded") {
            loadedStreams[CanonicalJSON.stringify(message.streamId)] = true
            // console.log("got loaded message", streamId, message)
            // Don't increment messagesReceivedCount as "loaded" is an advisory meta message from server
            if (streamId !== undefined && isMatchingStreamId(message.streamId, streamId)) {
                console.log("all server data loaded", messagesReceivedCount, new Date().toISOString())
                if (responder.onLoaded) responder.onLoaded(message.streamId)
            } else {
                if (responder.onLoaded) responder.onLoaded(message.streamId)
            }
        } else if (message.command === "streamStatus") {
            // Notify someone waiting for status of a stream
            const promiseResolver = echoPromises[message.uuid]
            if (promiseResolver) {
                promiseResolver.resolve(message.status)
                delete echoPromises[message.uuid]
            }
        }
        if (redrawCallback) redrawCallback()
    }

    function setup() {
        console.log("setup", streamId)
        // TODO: Concern: Want to get all messages, but new messages may be added while waiting
        socket = io(serverURL)

        socket.on("twirlip", function(message) {
            // console.log("twirlip", message)
            if (listeningOnStreams[CanonicalJSON.stringify(message.streamId)] 
                || message.command.startsWith("ack-")
                || message.command == "streamStatus"
            ) {
                messageReceived(message)
            }
        })

        socket.on("connect", function() {
            console.log("connect", socket.id, messagesReceivedCount, new Date().toISOString())
            requestAllMessages()
        })
    }

    function connect(aResponder) {
        responder = aResponder
    }

    function disconnect() {
        sendMessage({command: "unlisten", streamId: streamId})
        listeningOnStreams[CanonicalJSON.stringify(streamId)] = false
    }

    // bypasses stream configuration
    function openStream(streamId) {
        streamId = JSON.parse(CanonicalJSON.stringify(streamId))
        listeningOnStreams[CanonicalJSON.stringify(streamId)] = true
        sendMessage({command: "listen", streamId: streamId, fromIndex: 0})
    }

    function configure(streamIdNew, userIdNew) {
        if (streamIdNew !== undefined) {
            if (socket) sendMessage({command: "unlisten", streamId: streamId})
            listeningOnStreams[CanonicalJSON.stringify(streamId)] = false
            streamId = JSON.parse(CanonicalJSON.stringify(streamIdNew))
            listeningOnStreams[CanonicalJSON.stringify(streamId)] = true
            messagesReceivedCount = 0
            if (socket) requestAllMessages()
        }
        if (userIdNew !== undefined) userId = userIdNew
    }

    return {
        addItem,
        addItemAsync,
        getStreamStatusAsync,
        areAllStreamsLoaded,
        connect,
        setup,
        openStream,
        configure,
        getStreamId: function() { return streamId },
        isSetup: function() { return !!socket },
        isOnline: function() { return !!(socket && socket.connected) }
    }
}
