// Load optional local-config file

"use strict"
/* eslint-env node */
/* jslint node: true */

const log = require("./log")
const configDefault = require("./configDefault")

const argv = require("yargs").argv
console.log("argv", argv)

let localConfig = {}

try {
    log("info", "Loading config file")
    if (!argv.config) {
        localConfig = require("../../local-config")
    } else {
        localConfig = require("../../" + argv.config)
    }
} catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
        log("info", "No config file found -- using defaults")
    } else {
        log("error", "Problem when loading config file:", e)
        throw e
    }
}

const config = Object.assign({}, configDefault, localConfig)

module.exports = {
    config
}
