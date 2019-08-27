// function to process each line in a file with a callback

"use strict"
/* eslint-env node */
/* jslint node: true */

const fs = require("fs")

// From: http://stackoverflow.com/questions/7545147/nodejs-synchronization-read-large-file-line-by-line#7545170
function forEachLine(fd, callback, maxLines) {
    const bufSize = 64 * 1024
    const buf = Buffer.alloc(bufSize)
    let leftOver = ""
    let lineNum = 0
    let lines = []
    let n

    // TODO: make this not synchronous
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


function forEachLineInNamedFile(fileName, callback) {
    // TODO: make this asynchronous
    let fdMessages = null
    try {
        fdMessages = fs.openSync(fileName, "r")
    } catch (e) {
        // No file, so no saved data to send
    }
    if (fdMessages) {
        try {
            forEachLine(fdMessages, callback)
        } finally {
            // TODO Check error result
            fs.closeSync(fdMessages)
        }
    }   
}

module.exports = {
    forEachLine,
    forEachLineInNamedFile
} 
