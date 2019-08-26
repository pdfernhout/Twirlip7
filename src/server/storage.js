// File reading and writing

"use strict"
/* eslint-env node */
/* jslint node: true */

const fs = require("fs")
const crypto = require("crypto")

const log = require("./log")

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

module.exports ={
    calculateSha256,
    getFilePathForData,
    keyForStreamId,
    getStorageFileNameForMessage,
    storeMessage
}