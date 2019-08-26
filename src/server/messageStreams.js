// Handle socket.io processing

"use strict"
/* eslint-env node */
/* jslint node: true */

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
    log(address, "socket.io connection", clientId)

    socket.on("disconnect", function() {
        log(address, "socket.io disconnect", clientId)
    })

    socket.on("twirlip", function (message) {
        log(address, "socket.io message", clientId, message)
        processMessage(clientId, message)
    })
})

function sendMessageToAllClients(message) {
    // log("sendMessageToAllClients", JSON.stringify(message));
    // io.emit("twirlip", message); // This would send to all clients -- even ones not listening on stream
    const key = storage.keyForStreamId(message.streamId)
    const streams = streamToListenerMap[key]
    if (streams) {
        for (let clientId in streams) {
            if (streams[clientId]) {
                sendMessageToClient(clientId, message)
            }
        }
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
        listenerToStreamsMap[streamId] = streams
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
    //} else if (command === "directory") {
    //    directory(clientId, message)
    } else {
        log("unsupported command", command, message)
    }
}

function listen(clientId, message) {
    // TODO Handle only sending some recent messages or no previous messages
    const streamId = message.streamId
    const fromIndex = message.fromIndex || 0
    let messageCount = 0
    let messagesSent = 0

    log("listen", clientId, streamId, fromIndex)

    setListenerState(clientId, streamId, "listening")

    const fileName = storage.getStorageFileNameForMessage(message)

    // TODO: Make this asynchronous
    // TODO: Also  if asynchronous, maybe queue new messages for a client for sending later until this is done to preserve order
    function sendMessage(messageString) {
        if (messageCount < fromIndex) return
        messageCount++
        // TODO: Handle errors
        const message = JSON.parse(messageString)
        // log("listen sendMessage", clientId, message)
        sendMessageToClient(clientId, message)
        messagesSent++
    }
    forEachLineInFile.forEachLineInNamedFile(fileName, sendMessage)
    log("sending loaded", messagesSent)
    sendMessageToClient(clientId, {command: "loaded", streamId: streamId, messagesSentCount: messagesSent})
}

function unlisten(clientId, message) {
    const streamId = message.streamId
    log("unlisten (unfinished)", streamId)
    setListenerState(clientId, streamId, undefined)
}

function insert(clientId, message) {
    const streamId = message.streamId
    log("insert", clientId, streamId, message.item)
    storage.storeMessage(message)
    sendMessageToAllClients(message)
}

function remove(clientId, message) {
    const streamId = message.streamId
    log("remove (unfinished)", streamId)
    storage.storeMessage(message)
    sendMessageToAllClients(message)
}

function reset(clientId, message) {
    const streamId = message.streamId
    log("reset", streamId)
    // TODO: Perhaps should clear out file?
    storage.storeMessage(message)
    sendMessageToAllClients(message)
}

module.exports = {
    io
}