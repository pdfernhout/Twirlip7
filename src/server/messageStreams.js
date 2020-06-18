// Handle socket.io processing

// The processMessage function will typically handle the bulk of client requests.
// These requests concern streams of messages.
// The first request is typically to "listen" on a stream
// (which can result in being sent all the messages in the stream so far).
// Then the client can "insert" a new message to the stream (and then typically stored to disk).
// That new message is then sent to all listeners on the stream.
// If a client is no longer interested in a stream they can "unlisten" to it.

// A stream is usually stored on disk, but one can also be "ephemeral" and stored in memory.
// Ephemeral memory streams are named as strings starting with a special prefix.

"use strict"
/* eslint-env node */
/* jslint node: true */

const ephemeralStreamPrefix = "__EPHEMERAL:"

const SocketIOServer = require("socket.io")

const log = require("./log")
const storage = require("./storage")
const forEachLineInFile = require("./forEachLineInFile")

const streamToListenerMap = {}
const listenerToStreamsMap = {}
// TODO: const backloggedMessages = {}

const io = new SocketIOServer()

io.on("connection", function(socket) {
    const clientId = socket.id

    const address = socket.request.connection.remoteAddress
    log("debug", address, "socket.io connection", clientId)

    socket.on("disconnect", function() {
        log("debug", address, "socket.io disconnect", clientId)
    })

    socket.on("twirlip", function (message) {
        // log("debug", address, "socket.io message", clientId, message)
        processMessage(clientId, message)
    })
})

function sendMessageToAllClients(message, clientIdOfSender) {
    // log("debug", "sendMessageToAllClients", JSON.stringify(message));
    // io.emit("twirlip", message); // This would send to all clients -- even ones not listening on stream
    const key = storage.keyForStreamId(message.streamId)
    const listeners = streamToListenerMap[key]
    let senderReceivedEcho = false
    if (listeners) {
        for (let clientId in listeners) {
            if (listeners[clientId]) {
                sendMessageToClient(clientId, message)
                if (clientId === clientIdOfSender) senderReceivedEcho = true
            }
        }
    }
    if (!senderReceivedEcho) {
        log("debug", "sending special ack message to: " + clientIdOfSender)
        // Send a special ack message to sender can be sure this message (insert, remove, reset) was processed
        sendMessageToClient(clientIdOfSender, {command: "ack-" + message.command, streamId: message.streamId, userId: message.userId, timestamp: message.timestamp, uuid: message.uuid})
    }
}

function sendMessageToClient(clientId, message) {
    io.sockets.to(clientId).emit("twirlip", message)
}

function setListenerState(clientId, streamId, state) {
    const key = storage.keyForStreamId(streamId)
    let listeners = streamToListenerMap[key]
    if (!listeners) {
        listeners = {}
        streamToListenerMap[key] = listeners
    }

    if (state === undefined) {
        delete listeners[clientId]
    } else {
        listeners[clientId] = state
    }

    let streams = listenerToStreamsMap[clientId]
    if (!streams) {
        streams = {}
        listenerToStreamsMap[clientId] = streams
    }

    if (state === undefined) {
        delete streams[streamId]
    } else {
        streams[streamId] = state
    }
}

/* Commands for messages:
    listen -- start listening for messages after (optionally) getting all previous messages from a stream
    unlisten -- stop getting messages from a stream
    insert -- add a message to a stream
    remove -- remove one specific message from a stream (or act as if that happened)
    reset -- remove everything stored in stream to start over (or act as if that happened)
    streamStatus -- get some information about a stream (like how big it is and if it exists)
*/

function processMessage(clientId, message) {
    const command = message.command
    if (command === "listen") {
        listen(clientId, message)
    } else if (command === "unlisten") {
        unlisten(clientId, message)
    } else if (command === "insert") {
        insert(clientId, message)
    } else if (command === "remove") {
        remove(clientId, message)
    } else if (command === "reset") {
        reset(clientId, message)
    } else if (command === "streamStatus") {
        streamStatus(clientId, message)
    //} else if (command === "directory") {
    //    directory(clientId, message)
    } else {
        log("warn", "unsupported command", command, message)
    }
}

function isEphemeralStream(message) {
    return (typeof message.streamId === "string" && message.streamId.startsWith(ephemeralStreamPrefix))
}

function listen(clientId, message) {
    // TODO Handle only sending some recent messages or no previous messages
    const streamId = message.streamId
    const fromIndex = message.fromIndex || 0
    let messageCount = 0
    let messagesSent = 0

    log("info", "listen", clientId, JSON.stringify(streamId), fromIndex, storage.calculateSha256(storage.keyForStreamId(streamId)))

    setListenerState(clientId, streamId, "listening")

    if (isEphemeralStream(message)) {
        // don't save stream to file (typically for presence or voice chat)
        log("debug", "emphemeral stream connect: " + message.streamId)
        sendMessageToClient(clientId, {command: "loaded", streamId: streamId, messagesSentCount: 0})
        return
    }

    const fileName = storage.getStorageFileNameForMessage(message)

    // TODO: If asynchronous, ideally queue new messages for a client for sending later until this is done to preserve order?
    function sendMessage(messageString) {
        if (messageCount < fromIndex) return
        messageCount++
        // TODO: Handle errors
        const message = JSON.parse(messageString)
        // log("debug", "listen sendMessage", clientId, message)
        sendMessageToClient(clientId, message)
        messagesSent++
    }
    forEachLineInFile.forEachLineInNamedFile(fileName, sendMessage, 0).then(() => {
        log("debug", "sending loaded", messagesSent, JSON.stringify(message.streamId))
        sendMessageToClient(clientId, {command: "loaded", streamId: streamId, messagesSentCount: messagesSent})
    }).catch(error => {
        sendMessageToClient(clientId, {command: "loadingError", streamId: streamId})
        sendMessageToClient(clientId, {command: "loaded", streamId: streamId, messagesSentCount: messagesSent})
        throw error
    })
}

function unlisten(clientId, message) {
    const streamId = message.streamId
    log("debug", "unlisten (unfinished)", streamId)
    setListenerState(clientId, streamId, undefined)
}

function insert(clientId, message) {
    const streamId = message.streamId
    log("debug", "insert", JSON.stringify(clientId), JSON.stringify(streamId))
    // log("silly", {message})
    if (!isEphemeralStream(message)) {
        storage.storeMessage(message)
    } else {
        // log("debug", "not storing ephemeral message for: ", message.streamId)
    }
    sendMessageToAllClients(message, clientId)
}

function streamStatus(clientId, message) {
    const streamId = message.streamId

    ;(isEphemeralStream(message)
        ? Promise.resolve({
            streamId,
            exists: true,
            size: 0,
            isEphemeral: true
        })
        : storage.getStreamStatus(message.streamId)
    ).then(status => {
        sendMessageToClient(clientId, {
            command: "streamStatus",
            status,
            uuid: message.uuid
        })
    })

}

function remove(clientId, message) {
    const streamId = message.streamId
    log("debug", "remove (unfinished)", streamId)
    storage.storeMessage(message)
    sendMessageToAllClients(message, clientId)
}

function reset(clientId, message) {
    const streamId = message.streamId
    log("debug", "reset", streamId)
    // TODO: Perhaps should clear out file?
    storage.storeMessage(message)
    sendMessageToAllClients(message, clientId)
}

module.exports = {
    io
}