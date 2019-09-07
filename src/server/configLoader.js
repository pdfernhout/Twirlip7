// Load optional local-config file

"use strict"
/* eslint-env node */
/* jslint node: true */

const log = require("./log")
const configDefault = require("./configDefault")

let localConfig = {}

try {
    log("Loading config file")
    localConfig = require("../../local-config")
} catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
        log("No config file found -- using defaults")
    } else {
        console.log("Problem when loading cofig file:")
        throw e
    }
}

const config = Object.assign({}, configDefault, localConfig)

module.exports = {
    config
}
