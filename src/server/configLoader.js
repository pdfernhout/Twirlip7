// Load optional local-config file

"use strict"
/* eslint-env node */
/* jslint node: true */

const log = require("./log")
const configDefault = require("./configDefault")

const yargs = require("yargs")

let localConfig = {}

const argv = yargs.option({
    config: {
        describe: "use different config file then config-local.js"
    }
}).help().argv

console.log("yargs.argv", argv)

try {
    log("info", "Loading config file")
    if (!argv.config) {
        localConfig = require("../../local-config")
    } else {
        localConfig = require("../../" + argv.config)
    }
} catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
        log("info", "No config file found, so using defaults")
    } else {
        log("error", "Problem when loading config file:", e)
        throw e
    }
}

const config = Object.assign({}, configDefault, localConfig)

module.exports = {
    config
}
