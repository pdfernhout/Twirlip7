#!/usr/bin/env node

// Test at: http://localhost:8080
// Set DEBUG=* for low-level socket-io debugging:
// DEBUG=* node server/twirlip7-server.js

/* eslint-env node */
/*jslint node: true */

"use strict"

// Standard nodejs modules
const http = require("http")
const path = require("path")

const express = require("express")
const bodyParser = require("body-parser")

const https = require("https")
const pem = require("pem")

const proxyRequest = require("./proxyRequest")
const storage = require("./storage")
const log = require("./log")
const messageStreams = require("./messageStreams")

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

app.use(express.static(path.normalize(__dirname + "/../ui")))

app.post("/api/proxy", function (request, response) {
    proxyRequest(request, response)
})

// Example use: http://localhost:8080/sha256/somesha?content-type=image/png&title=some%20title
app.get("/sha256/:sha256", storage.respondWithReconstructedFile)

// Create an HTTP service.
const httpServer = http.createServer(app).listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function () {
    messageStreams.io.attach(httpServer)
    const host = httpServer.address().address
    const port = httpServer.address().port
    log("Twirlip server listening at http://" + host + ":" + port)
})

// Create an HTTPS service
pem.createCertificate({ days: 365, selfSigned: true }, function(err, keys) {
    let proposedPort = parseInt(process.env.PORT)
    if (proposedPort) proposedPort++
    const httpsServer = https.createServer({ key: keys.serviceKey, cert: keys.certificate }, app).listen(proposedPort || 8081, process.env.IP || "0.0.0.0", function () {
        messageStreams.io.attach(httpsServer)
        const host = httpsServer.address().address
        const port = httpsServer.address().port
        log("Twirlip server listening at https://" + host + ":" + port)
    })
})
