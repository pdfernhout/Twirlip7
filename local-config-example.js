// Config file
// Copy this to local-config.js to change default configurations

"use strict"
/* eslint-env node */
/* jslint node: true */

const config = module.exports = {}

config.ip = "0.0.0.0"
config.port = 8080
config.sshPort = 8081

// directory relative to root of project
config.dataDirectory = "server-data"
