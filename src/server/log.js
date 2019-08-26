// logging functionality

"use strict"
/* eslint-env node */
/* jslint node: true */

function log() {
    console.log.apply(console, ["[" + new Date().toISOString() + "]"].concat(Array.prototype.slice.call(arguments)))
}

module.exports = log
