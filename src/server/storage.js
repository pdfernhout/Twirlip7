// File reading and writing of messages for streams

"use strict"
/* eslint-env node */
/* jslint node: true */

const fs = require("fs")
const crypto = require("crypto")
const url = require("url")
const mime = require("mime-types")
const filenamify = require("filenamify")
const path = require("path")

const { promisify } = require("util")
const exists = promisify(fs.exists)
const mkdir = promisify(fs.mkdir)
const appendFile = promisify(fs.appendFile)
const stat = promisify(fs.stat)

const log = require("./log")
const forEachLineInFile = require("./forEachLineInFile")
const CanonicalJSON = require("./CanonicalJSON")

const { config } = require("./configLoader")

const dataDirectory = path.normalize(__dirname + "/../../" + config.dataDirectory)

log("info", "Using dataDirectory: " + dataDirectory)

const storageExtension = ".txt"

const messageStorageQueue = []
let messageStorageTimeout = null

function calculateSha256(value) {
    const sha256 = crypto.createHash("sha256")
    sha256.update(value, "utf8")
    const result = sha256.digest("hex")
    return result
}

async function ensureFilePathForSHA256(sha256) {
    const segments = [dataDirectory]

    let directoryName

    segments.push(sha256.substring(0, 2))
    directoryName = segments.join("/")
    if (! await exists(directoryName)) {
        try {
            await mkdir(directoryName)
        } catch (e) {
            log("warn", "mkdir failed: " + directoryName)
        }
    }

    segments.push(sha256.substring(2, 4))
    directoryName = segments.join("/")
    if (! await exists(directoryName)) {
        try {
            await mkdir(directoryName)
        } catch (e) {
            log("warn", "mkdir failed: " + directoryName)
        }
    }

    segments.push(sha256.substring(4, 6))
    directoryName = segments.join("/")
    if (! await exists(directoryName)) {
        try {
            await mkdir(directoryName)
        } catch (e) {
            log("warn", "mkdir failed: " + directoryName)
        }
    }
}

function getFilePathForData(sha256) {
    const segments = [dataDirectory]
    segments.push(sha256.substring(0, 2))
    segments.push(sha256.substring(2, 4))
    segments.push(sha256.substring(4, 6))
    segments.push(sha256)
    const result = segments.join("/")
    return result
}

function keyForStreamId(streamId) {
    return CanonicalJSON.stringify(streamId)
}

function getStorageFileNameForSHA256(sha256) {
    return getFilePathForData(sha256) + storageExtension
}

function getStorageFileNameForMessage(message) {
    const key = keyForStreamId(message.streamId)
    const sha256 = calculateSha256(key)
    return getFilePathForData(sha256) + storageExtension
}

// TODO: Could schedule up to one active write per file for more throughput...
async function writeNextMessage() {
    if (!messageStorageQueue.length) return
    const message = messageStorageQueue.shift()
    const lineToWrite = JSON.stringify(message) + "\n"
    const key = keyForStreamId(message.streamId)
    const sha256 = calculateSha256(key)
    const fileName = getStorageFileNameForSHA256(sha256)
    await ensureFilePathForSHA256(sha256)
    // TODO: Do we need to do this with a fd and datasync to be really sure data is written to storage?
    try {
        await appendFile(fileName, lineToWrite)
    } catch (err) {  
        log("debug", "Problem writing file", err)
        // Should we not keep trying to store data even if an error?
        // return
    }
    scheduleMessageWriting()
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

async function getStreamStatus(streamId) {
    const key = keyForStreamId(streamId)
    const sha256 = calculateSha256(key)
    const fileName = getStorageFileNameForSHA256(sha256)
    try {
        const stats = await stat(fileName)
        log("debug", "file exists", streamId, fileName, stats)
        return {
            streamId,
            exists: true,
            size: stats.size,
            isEphemeral: false
        } 
    } catch (error) {
        if (error.code !== "ENOENT") {
            log("error", "getStreamStatus: unexpected error", error)
        }
        log("debug", "file does not exist", streamId, fileName)
        return {
            streamId,
            exists: false,
            size: 0,
            isEphemeral: false
        }
    }
}

function respondWithReconstructedFile(request, response) {
    const queryData = url.parse(request.url, true).query
    log("debug", "/sha256", request.params)
    // response.json({params: request.params, queryData: queryData})
    const sha256Requested = request.params.sha256
    const streamId = {sha256: sha256Requested}
    const sha256OfStorageFile = calculateSha256(JSON.stringify(streamId))
    const fileName = getFilePathForData(sha256OfStorageFile) + storageExtension

    fs.exists(fileName, exists => {
        if (!exists) {
            response.sendStatus(404)
            return
        }

        // TODO: stream instead of accumulate as otherwise may use a lot of memory for big files -- but base64 incomplete issue
        const result = {}

        function collectFileContents(messageString) {
            const message = JSON.parse(messageString)
            if (message.item && JSON.stringify(message.item.a) === JSON.stringify(streamId)) {
                result[message.item.b] = message.item.c
            }
            // TODO: Next line is for legacy support from earlier design and could be removed eventually
            if (message.item && message.item.a === "sha256:" + sha256Requested) {
                result[message.item.b] = message.item.c
            }
        }

        forEachLineInFile.forEachLineInNamedFile(fileName, collectFileContents, 0).then(() => {

            let reconstruct = ""
            for (let i = 0; i < result["base64-segment-count"]; i++) {
                reconstruct += result["base64-segment:" + i]
            }

            let buffer = Buffer.from(reconstruct, "base64")

            log("debug", "reconstruct.length", reconstruct.length)
            log("debug", "binary length", buffer.byteLength)

            const contentType = queryData["content-type"] || mime.lookup(result["filename"])
            log("debug", "contentType", contentType, result["filename"])

            const cleanFileName = filenamify(Buffer.from(queryData["filename"] || result["filename"] || "download.dat").toString("ascii"), {replacement: "_"})

            const disposition = queryData["content-disposition"] === "attachment" ? "attachment" : "inline"

            response.writeHead(200, {
                "Content-Type": contentType || "",
                "Content-Disposition": disposition + "; filename=" + cleanFileName
            })

            response.end(buffer)
        }).catch(error => {
            response.sendStatus(500)
            throw error
        })
    })
}

module.exports = {
    calculateSha256,
    keyForStreamId,
    getStorageFileNameForMessage,
    storeMessage,
    getStreamStatus,
    respondWithReconstructedFile
}