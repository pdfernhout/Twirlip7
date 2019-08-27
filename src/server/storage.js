// File reading and writing

"use strict"
/* eslint-env node */
/* jslint node: true */

const fs = require("fs")
const crypto = require("crypto")
const url = require("url")
const mime = require("mime-types")
const filenamify = require("filenamify")

const log = require("./log")
const forEachLineInFile = require("./forEachLineInFile")

const dataDirectory = __dirname + "/../../server-data"
const storageExtension = ".txt"

const messageStorageQueue = []
let messageStorageTimeout = null

function calculateSha256(value) {
    const sha256 = crypto.createHash("sha256")
    sha256.update(value, "utf8")
    const result = sha256.digest("hex")
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

function keyForStreamId(streamId) {
    return JSON.stringify(streamId)
}

function getStorageFileNameForMessage(message, createPath) {
    const key = keyForStreamId(message.streamId)
    const sha256 = calculateSha256(key)
    return getFilePathForData(sha256, createPath) + storageExtension
}

// TODO: Could schedule up to one active write per file for more throughput...
function writeNextMessage() {
    if (!messageStorageQueue.length) return
    const message = messageStorageQueue.shift()
    const lineToWrite = JSON.stringify(message) + "\n"
    const fileName = getStorageFileNameForMessage(message, "createPath")
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

function respondWithReconstructedFile(request, response) {
    const queryData = url.parse(request.url, true).query
    console.log("/sha256", request.params)
    // response.json({params: request.params, queryData: queryData})
    const sha256Requested = request.params.sha256
    const sha256OfStorageFile = calculateSha256(JSON.stringify({sha256: sha256Requested}))
    const fileName = getFilePathForData(sha256OfStorageFile) + storageExtension

    // TODO: stream instead of accumulate
    const result = {}

    function collectFileContents(messageString) {
        const message = JSON.parse(messageString)
        if (message.item && message.item.a === "sha256:" + sha256Requested) {
            result[message.item.b] = message.item.c
        }
    }

    // TODO: Make asynchronous
    forEachLineInFile.forEachLineInNamedFile(fileName, collectFileContents)

    let reconstruct = ""
    for (let i = 0; i < result["base64-segment-count"]; i++) {
        reconstruct += result["base64-segment:" + i]
    }

    let buffer = Buffer.from(reconstruct, "base64")

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
}

module.exports ={
    calculateSha256,
    getFilePathForData,
    keyForStreamId,
    getStorageFileNameForMessage,
    storeMessage,
    respondWithReconstructedFile
}