"use strict"

/* global module, require */

const requestAPI = require("request")
const respond = require("./respond")

// TODO: Retrieve the requested web resource -- very unsafe:
// TODO: user should be authenticated and trusted or requests should be restricted to local ones
function proxyRequest(request, response) {
    const url = request.body.url
    const options = {
        uri : url,
        jar : false,
        proxy : false,
        followRedirect : true,
        timeout : 1000 * 9
    }

    if (!url) {
        respond.fail(response, "url field was not specified in request")
    } else if (request.body.proxyKey !== "swordfish") {
        respond.fail(response, "incorrect or missing proxyKey in request")
    } else if (url.substring(0, 5) === "http:" || url.substring(0, 6) === "https:") {
        requestAPI(options, function(error, requestResponse, content) {
            if (error || content === null) {
                if (error) {
                    respond.fail(response, "The request failed for some reason: " + error)
                } else {
                    respond.fail(response, "The resource is not available: " + url)
                }
            } else {
                respond.success(response, { content: content })
            }
        })
    } else {
        respond.fail(response, "Only http or https protocols are allowed: " + url)
    }
}

module.exports = proxyRequest
