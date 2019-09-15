"use strict"

// Assumes socket.io loaded from script tag to define io
/* global io */

import { CanonicalJSON } from "./CanonicalJSON.js"

// returns position + 1 for item reference to avoid first item being "0"
export function StoreUsingServer(redrawCallback, streamId = "common", userId = "anonymous", serverURL = "") {
    let socket = null
    let messagesReceivedCount = 0
    let responder = null
    let listeningOnStreams = {}

    streamId = JSON.parse(CanonicalJSON.stringify(streamId))

    // alternateStreamId is optional
    function addItem(item, alternateStreamId) {
        sendInsertItemMessage(item, alternateStreamId)
    }

    // =============== socket.io communications

    function sendMessage(message) {
        socket.emit("twirlip", message)
    }

    // alternateStreamId is optional
    function sendInsertItemMessage(item, alternateStreamId) {
        if (alternateStreamId !== undefined) alternateStreamId = JSON.parse(CanonicalJSON.stringify(alternateStreamId))
        sendMessage({command: "insert", streamId: alternateStreamId || streamId, item: item, userId: userId, timestamp: new Date().toISOString()})
    }

    function requestAllMessages() {
        console.log("requestAllMessages", messagesReceivedCount)
        listeningOnStreams[CanonicalJSON.stringify(streamId)] = true
        sendMessage({command: "listen", streamId: streamId, fromIndex: messagesReceivedCount})
    }

    function isMatchingStreamId(a, b) {
        // TODO: Optimize
        return CanonicalJSON.stringify(a) === CanonicalJSON.stringify(b)
    }

    function messageReceived(message) {
        // console.log("messageReceived", message)
        if (message.command === "insert") {
            if (isMatchingStreamId(message.streamId, streamId)) messagesReceivedCount++
            responder.onAddItem(message.item)
        } else if (message.command === "remove") {
            if (isMatchingStreamId(message.streamId, streamId)) messagesReceivedCount++
            console.log("TODO: Remove message not handled")
        } else if (message.command === "reset") {
            if (isMatchingStreamId(message.streamId, streamId)) messagesReceivedCount++
            // TODO: Should handle timestamps somehow, so earlier messages before last reset are rejected
            // clearItems()
            console.log("TODO: clear items not handled")
        } else if (message.command === "loaded") {
            // console.log("got loaded message", streamId, message)
            // Don't increment messagesReceivedCount as "loaded" is an advisory meta message from server
            if (streamId !== undefined && isMatchingStreamId(message.streamId, streamId)) {
                console.log("all server data loaded", messagesReceivedCount, new Date().toISOString())
                if (responder.onLoaded) responder.onLoaded(message.streamId)
            } else {
                if (responder.onLoaded) responder.onLoaded(message.streamId)
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
            if (listeningOnStreams[CanonicalJSON.stringify(message.streamId)]) {
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
        sendMessage,
        sendInsertItemMessage,
        connect,
        setup,
        openStream,
        configure,
        getStreamId: function() { return streamId },
        isSetup: function() { return !!socket },
        isOnline: function() { return !!(socket && socket.connected) }
    }
}
