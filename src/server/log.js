// logging functionality

"use strict"
/* eslint-env node */
/* jslint node: true */

const path = require("path")
const winston = require("winston")

const timestamp = new Date().toISOString().replace("T", "_").replace(/:/g, "_").replace(".", "_")

const logger = winston.createLogger({
    level: "silly",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    // defaultMeta: { service: "twirlip-server" },
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log` 
        // - Write all logs error (and below) to `error.log`.
        //
        // TODO: Support configuring log directory
        new winston.transports.File({ filename: path.join(__dirname, "..", "..", "server-log/twirlip-" + timestamp + "-warn.log"), level: "warn" }),
        new winston.transports.File({ filename: path.join(__dirname, "..", "..", "server-log/twirlip-" + timestamp + "-all.log") })
    ]
})
  
//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
const myFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`
})

if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({
        level: "info",
        format: winston.format.combine(
            winston.format.timestamp(),
            myFormat
        )
    }))
}

// First arg can be any string of: error, warn, info, verbose, debug, and silly.
function log(level, ...args) {
    if (args.length <= 1) {
        logger.log(level, ...args)
    } else {
        const message = []
        for (let i in args) {
            message.push(args[i])
        }
        logger.log(level, {message})
    }
}

module.exports = log
