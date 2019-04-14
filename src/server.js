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
var url = require("url")
var mime = require('mime-types')

var express = require("express")
var bodyParser = require("body-parser")
var SocketIOServer = require("socket.io")

var https = require("https")
var pem = require("pem")

var proxyRequest = require("./proxyRequest")

var dataDirectory = __dirname + "/../server-data"
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

function ipForRequest(request) {
    return request.headers["x-forwarded-for"]
        || request.connection.remoteAddress
        || request.socket.remoteAddress
        || request.connection.socket.remoteAddress
}

function logger(request, response, next) {
    log(ipForRequest(request), request.method, request.url)
    next()
}

app.use(logger)

// Include support to parse JSON-encoded bodies (and saving the rawBody)
// TODO: Could there be an issue with bodyParser with undeleted temp files? (Mentioned somewhere online)
app.use(bodyParser.json({
    limit: "10mb"
}))

// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
}))

app.use(express.static(__dirname + "/ui"))

app.post("/api/proxy", function (request, response) {
    proxyRequest(request, response)
})

// http://localhost:8080/sha256/somesha?content-type=image/png&title=some%20title
app.get("/sha256/:sha256", function (request, response) {
    var queryData = url.parse(request.url, true).query
    console.log("/sha256", request.params)
    // response.json({params: request.params, queryData: queryData})
    var sha256Requested = request.params.sha256
    var sha256OfStorageFile = calculateSha256(JSON.stringify({sha256: sha256Requested}))
    var fileName = getFilePathForData(sha256OfStorageFile) + storageExtension

    // TODO: stream instead of accumulate
    var result = {}

    function collectFileContents(messageString) {
        var message = JSON.parse(messageString)
        if (message.item && message.item.a === "sha256:" + sha256Requested) {
            result[message.item.b] = message.item.c
        }
    }

    // TODO: make this asynchronous
    var fdMessages = null
    try {
        fdMessages = fs.openSync(fileName, "r")
    } catch (e) {
        // No file, so no saved data to send
    }
    if (fdMessages) {
        try {
            forEachLine(fdMessages, collectFileContents)
        } finally {
            // TODO Check error result
            fs.closeSync(fdMessages)
        }
    }

    var reconstruct = ""
    for (var i = 0; i < result["base64-segment-count"]; i++) {
        reconstruct += result["base64-segment:" + i]
    }

    let buffer = new Buffer(reconstruct, "base64")

    console.log("reconstruct.length", reconstruct.length)
    console.log("binary length", buffer.byteLength)

    const contentType = queryData["content-type"] || mime.lookup(result["filename"])
    console.log("contentType", contentType)

    if (contentType) response.writeHead(200, {
        "Content-Type": contentType,
        "Content-Disposition": result["filename"] ? "inline; filename=" + result["filename"] :  undefined
    })

    response.end(buffer)
})

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

    var address = socket.request.connection.remoteAddress
    log(address, "socket.io connection", clientId)

    socket.on("disconnect", function() {
        log(address, "socket.io disconnect", clientId)
    })

    socket.on("twirlip", function (message) {
        log(address, "socket.io message", clientId, message)
        processMessage(clientId, message)
    })
})

function keyForStreamId(streamId) {
    return JSON.stringify(streamId)
}

function sendMessageToAllClients(message) {
    // log("sendMessageToAllClients", JSON.stringify(message));
    // io.emit("twirlip", message); // This would send to all clients -- even ones not listening on stream
    var key = keyForStreamId(message.streamId)
    var streams = streamToListenerMap[key]
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
    var key = keyForStreamId(streamId)
    var listeners = streamToListenerMap[key]
    if (!listeners) {
        listeners = {}
        streamToListenerMap[key] = listeners
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

    log("listen", clientId, streamId, fromIndex)

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
    log("sending loaded", messagesSent)
    sendMessageToClient(clientId, {command: "loaded", streamId: streamId, messagesSentCount: messagesSent})
}

function unlisten(clientId, message) {
    var streamId = message.streamId
    log("unlisten (unfinished)", streamId)
    setListenerState(clientId, streamId, undefined)
}

function insert(clientId, message) {
    var streamId = message.streamId
    log("insert", clientId, streamId, message.item)
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

function getFilePathForData(sha256, createPath) {
    const segments = [dataDirectory]
    // TODO: Use asynchronous directory creation
    segments.push(sha256.substring(0, 2))
    if (createPath && !fs.existsSync(segments.join("/"))) {
        fs.mkdirSync(segments.join("/"))
    }
    segments.push(sha256.substring(2, 4))
    if (createPath && !fs.existsSync(segments.join("/"))) {
        fs.mkdirSync(segments.join("/"))
    }
    segments.push(sha256.substring(4, 6))
    if (createPath && !fs.existsSync(segments.join("/"))) {
        fs.mkdirSync(segments.join("/"))
    }
    segments.push(sha256)
    const result = segments.join("/")
    return result
}

function getStorageFileNameForMessage(message, createPath) {
    var key = keyForStreamId(message.streamId)
    var sha256 = calculateSha256(key)
    return getFilePathForData(sha256, createPath) + storageExtension
}

// TODO: Could schedule up to one active write per file for more throughput...
function writeNextMessage() {
    if (!messageStorageQueue.length) return
    var message = messageStorageQueue.shift()
    var lineToWrite = JSON.stringify(message) + "\n"
    var fileName = getStorageFileNameForMessage(message, "createPath")
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
