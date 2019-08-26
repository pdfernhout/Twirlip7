#!/usr/bin/env node

// Test at: http://localhost:8080
// Set DEBUG=* for low-level socket-io debugging:
// DEBUG=* node server/twirlip-server.js

/* eslint-env node */
/*jslint node: true */

"use strict"

// Standard nodejs modules
const fs = require("fs")
const http = require("http")
const url = require("url")
const mime = require("mime-types")
const filenamify = require("filenamify")

const express = require("express")
const bodyParser = require("body-parser")

const https = require("https")
const pem = require("pem")

const proxyRequest = require("./proxyRequest")
const forEachLine = require("./forEachLine")
const storage = require("./storage")
const log = require("./log")
const messages = require("./messages")

const storageExtension = ".txt"

const app = express()

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

app.use(express.static(__dirname + "/../ui"))

app.post("/api/proxy", function (request, response) {
    proxyRequest(request, response)
})

// http://localhost:8080/sha256/somesha?content-type=image/png&title=some%20title
app.get("/sha256/:sha256", function (request, response) {
    const queryData = url.parse(request.url, true).query
    console.log("/sha256", request.params)
    // response.json({params: request.params, queryData: queryData})
    const sha256Requested = request.params.sha256
    const sha256OfStorageFile = storage.calculateSha256(JSON.stringify({sha256: sha256Requested}))
    const fileName = storage.getFilePathForData(sha256OfStorageFile) + storageExtension

    // TODO: stream instead of accumulate
    const result = {}

    function collectFileContents(messageString) {
        const message = JSON.parse(messageString)
        if (message.item && message.item.a === "sha256:" + sha256Requested) {
            result[message.item.b] = message.item.c
        }
    }

    // TODO: make this asynchronous
    let fdMessages = null
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

    let reconstruct = ""
    for (let i = 0; i < result["base64-segment-count"]; i++) {
        reconstruct += result["base64-segment:" + i]
    }

    let buffer = new Buffer(reconstruct, "base64")

    console.log("reconstruct.length", reconstruct.length)
    console.log("binary length", buffer.byteLength)

    const contentType = queryData["content-type"] || mime.lookup(result["filename"])
    console.log("contentType", contentType, result["filename"])

    const cleanFileName = filenamify(Buffer.from(queryData["filename"] || result["filename"] || "download.dat").toString("ascii"), {replacement: "_"})

    const disposition = queryData["content-disposition"] === "attachment" ? "attachment" : "inline"

    response.writeHead(200, {
        "Content-Type": contentType || "",
        "Content-Disposition": disposition + "; filename=" + cleanFileName
    })

    response.end(buffer)
})

// Create an HTTP service.
const httpServer = http.createServer(app).listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function () {
    messages.io.attach(httpServer)
    const host = httpServer.address().address
    const port = httpServer.address().port
    log("Twirlip server listening at http://" + host + ":" + port)
})

// Create an HTTPS service
pem.createCertificate({ days: 365, selfSigned: true }, function(err, keys) {
    let proposedPort = parseInt(process.env.PORT)
    if (proposedPort) proposedPort++
    const httpsServer = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(proposedPort || 8081, process.env.IP || "0.0.0.0", function () {
        messages.io.attach(httpsServer)
        const host = httpsServer.address().address
        const port = httpsServer.address().port
        log("Twirlip server listening at https://" + host + ":" + port)
    })
})
