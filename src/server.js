#!/usr/bin/env node

// Test at: http://localhost:8080
// Set DEBUG=* for low-level socket-io debugging:
// DEBUG=* node server/twirlip-server.js

/* eslint-env node */
/*jslint node: true */

"use strict"

// Standard nodejs modules
var fs = require("fs")
var http = require("http")
var crypto = require("crypto")

var express = require("express")
var SocketIOServer = require("socket.io")

var https = require("https")
var pem = require("pem")

var dataDirectory = __dirname + "/../server-data/"
var storageExtension = ".txt"

var messageStorageQueue = []
var messageStorageTimeout = null

var streamToListenerMap = {}
var listenerToStreamsMap = {}
// TODO: var backloggedMessages = {}

var app = express()

function log() {
    console.log.apply(console, ["[" + new Date().toISOString() + "]"].concat(Array.prototype.slice.call(arguments)))
}

log("Twirlip7 server started")

var logger = function(request, response, next) {
    log("Request:", request.method, request.url)
    next()
}

app.use(logger)

app.use(express.static(__dirname + "/ui"))

var io = new SocketIOServer()

// Create an HTTP service.
var httpServer = http.createServer(app).listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function () {
    io.attach(httpServer)
    var host = httpServer.address().address
    var port = httpServer.address().port
    log("Twirlip server listening at http://" + host + ":" + port)
})

// Create an HTTPS service
pem.createCertificate({ days: 120, selfSigned: true }, function(err, keys) {
    var proposedPort = parseInt(process.env.PORT)
    if (proposedPort) proposedPort++
    var httpsServer = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(proposedPort || 8081, process.env.IP || "0.0.0.0", function () {
        io.attach(httpsServer)
        var host = httpsServer.address().address
        var port = httpsServer.address().port
        log("Twirlip server listening at https://" + host + ":" + port)
    })
})

io.on("connection", function(socket) {
    var clientId = socket.id
    log("a user connected", clientId)
    
    socket.on("disconnect", function() {
        log("user disconnected", clientId)
    })
    
    socket.on("twirlip", function (message) {
        log("----- twirlip received message", clientId)
        processMessage(clientId, message)
    })
})

function sendMessageToAllClients(message) {
    // log("sendMessageToAllClients", JSON.stringify(message));
    // io.emit("twirlip", message); // This would send to all clients -- even ones not listening on stream
    var streams = streamToListenerMap[message.streamId]
    if (streams) {
        for (var clientId in streams) {
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
    var listeners = streamToListenerMap[streamId]
    if (!listeners) {
        listeners = {}
        streamToListenerMap[streamId] = listeners
    }
    
    if (state === undefined) {
        delete listeners[clientId]
    } else {
        listeners[clientId] = state
    }
    
    var streams = listenerToStreamsMap[clientId]
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
    var command = message.command
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
    var streamId = message.streamId
    var fromIndex = message.fromIndex || 0
    var messageCount = 0
    var messagesSent = 0
    
    log("listen", clientId, streamId, fromIndex, new Date().toISOString())
    
    setListenerState(clientId, streamId, "listening")
    
    var fileName = getStorageFileNameForMessage(message)

    // TODO: Make this asynchronous
    // TODO: Also  if asynchronous, maybe queue new messages for a client for sending later until this is done to preserve order
    function sendMessage(messageString) {
        if (messageCount < fromIndex) return
        messageCount++
        // TODO: Handle errors
        var message = JSON.parse(messageString)
        // log("listen sendMessage", clientId, message)
        sendMessageToClient(clientId, message)
        messagesSent++
    }
    var fdMessages = null
    try {
        fdMessages = fs.openSync(fileName, "r")
    } catch (e) {
        // No file, so no saved data to send
    }
    if (fdMessages) {
        try {
            forEachLine(fdMessages, sendMessage)
        } finally {
            // TODO Check error result
            fs.closeSync(fdMessages)
        }
    }
    log("sending loaded", messagesSent, new Date().toISOString())
    sendMessageToClient(clientId, {command: "loaded", streamId: streamId})
}

function unlisten(clientId, message) {
    var streamId = message.streamId
    log("unlisten (unfinished)", streamId)
    setListenerState(clientId, streamId, undefined)
}

function insert(clientId, message) {
    var streamId = message.streamId
    log("insert", clientId, streamId, calculateSha256(message.item))
    storeMessage(message)
    sendMessageToAllClients(message)
}

function remove(clientId, message) {
    var streamId = message.streamId
    log("remove (unfinished)", streamId)
    storeMessage(message)
    sendMessageToAllClients(message)
}

function reset(clientId, message) {
    var streamId = message.streamId
    log("reset", streamId)
    // TODO: Perhaps should clear out file?
    storeMessage(message)
    sendMessageToAllClients(message)
}
   
// File reading and writing

function calculateSha256(value) {
    var sha256 = crypto.createHash("sha256")
    sha256.update(value, "utf8")
    var result = sha256.digest("hex")
    return result
}

function getStorageFileNameForMessage(message) {
    var streamId = message.streamId
    var hash = calculateSha256(streamId)
    return dataDirectory + hash + storageExtension
}

// TODO: Could schedule up to one active write per file for more throughput...
function writeNextMessage() {
    if (!messageStorageQueue.length) return
    var message = messageStorageQueue.shift()
    var lineToWrite = JSON.stringify(message) + "\n"
    var fileName = getStorageFileNameForMessage(message)
    // TODO: Do we need to datasync to be really sure data is written?
    fs.appendFile(fileName, lineToWrite, function (err) {
        if (err) {
            log("Problem writing file", err)
            return
        }
        scheduleMessageWriting()
    })
}

function scheduleMessageWriting() {
    if (!messageStorageTimeout) {
        messageStorageTimeout = setTimeout(function () {
            messageStorageTimeout = null
            writeNextMessage()
        }, 0)
    }
}

function storeMessage(message) {
    messageStorageQueue.push(message)
    scheduleMessageWriting()
}

// From: http://stackoverflow.com/questions/7545147/nodejs-synchronization-read-large-file-line-by-line#7545170
function forEachLine(fd, callback, maxLines) {
    var bufSize = 64 * 1024
    var buf = new Buffer(bufSize)
    var leftOver = ""
    var lineNum = 0
    var lines
    var n

    while ((n = fs.readSync(fd, buf, 0, bufSize, null)) !== 0) {
        lines = buf.toString("utf8", 0 , n).split("\n")
        // add leftover string from previous read
        lines[0] = leftOver + lines[0]
        while (lines.length > 1) {
            // process all but the last line
            callback(lines.shift(), lineNum)
            lineNum++
            if (maxLines && maxLines >= lineNum) return
        }
        // save last line fragment (may be "")
        leftOver = lines.shift()
    }
    if (leftOver) {
        // process any remaining line
        callback(leftOver, lineNum)
    }
}
