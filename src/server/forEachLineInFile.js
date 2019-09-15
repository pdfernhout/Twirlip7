// function to process each line in a file with a callback

"use strict"
/* eslint-env node */
/* jslint node: true */

const fs = require("fs")
const { promisify } = require("util")
const read = promisify(fs.read)
const open = promisify(fs.open)
const close = promisify(fs.close)

// Derived from: http://stackoverflow.com/questions/7545147/nodejs-synchronization-read-large-file-line-by-line#7545170
async function forEachLine(fd, lineCallback, maxLines) {
    const bufSize = 64 * 1024
    const buf = Buffer.alloc(bufSize)
    let leftOver = ""
    let lineNum = 0
    let lines = []

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const readResult = await read(fd, buf, 0, bufSize, null)
        if (readResult.bytesRead === 0) break
        lines = buf.toString("utf8", 0 , readResult.bytesRead).split("\n")
        // add leftover string from previous read
        lines[0] = leftOver + lines[0]
        while (lines.length > 1) {
            // process all but the last line
            const line = lines.shift()
            lineCallback(line, lineNum)
            lineNum++
            if (maxLines && maxLines >= lineNum) return
        }
        // save last line fragment (may be "")
        leftOver = lines.shift()
    }
    if (leftOver) {
        // process any remaining line
        lineCallback(leftOver, lineNum)
    }
}


async function forEachLineInNamedFile(fileName, lineCallback, maxLines) {
    let fd = null
    try {
        fd = await open(fileName, "r")
    } catch (e) {
        // log("debug", "error opening file: " + fileName)
        // No file, so no saved data to send
    }
    if (fd) {
        try {
            await forEachLine(fd, lineCallback, maxLines)
        } finally {
            // TODO Check error result
            await close(fd)
        }
    }
}

module.exports = {
    forEachLine,
    forEachLineInNamedFile
} 
