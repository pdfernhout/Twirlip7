"use strict"

/* global module, require, __dirname */
const fetch = require("node-fetch")
const respond = require("./respond")
const fs = require("fs")
const path = require("path")
const log = require("./log")

// TODO: Retrieve the requested web resource -- very unsafe!
// TODO: user should be authenticated and trusted or requests should be restricted to local ones
function proxyRequest(request, response) {
    const url = request.body.url

    const proxyKeyFileName = "proxyKey.txt"

    const proxyKeyFullPath = path.normalize(path.join(__dirname, "..", proxyKeyFileName))

    fs.readFile(proxyKeyFullPath, function(error, data) {
        if (error) {
            respond.fail(response, "Proxy use is not configured for this server.")
            return
        }

        const proxyKey = data.toString().trim()

        if (!url) {
            respond.fail(response, "url field was not specified in request")
        } else if (request.body.proxyKey !== proxyKey) {
            respond.fail(response, "incorrect or missing proxyKey in request")
        } else if (url.substring(0, 5) === "http:" || url.substring(0, 6) === "https:") {
            log("info", "Proxying request: " + url)
            fetch(url, {
                method: 'GET'
            }).then(async response => {
                const content = await response.text()
                respond.success(response, { content: content })
            }).catch(error => {
                if (error) {
                    respond.fail(response, "The request failed for some reason: " + error)
                } else {
                    respond.fail(response, "The resource is not available: " + url)
                }
            })
        } else {
            respond.fail(response, "Only http or https protocols are allowed: " + url)
        }
    })
}

module.exports = proxyRequest
