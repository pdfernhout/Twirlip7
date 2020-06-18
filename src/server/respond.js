// Routines to return standardized responses as JSON

"use strict"

/* global exports */

function success(response, extra) {
    var result = {
        success: true,
        status: "OK",
    }
    
    for (var key in extra) {
        // eslint-disable-next-line no-prototype-builtins
        if (extra.hasOwnProperty(key)) {
            result[key] = extra[key]
        }
    }
    
    response.json(result)
    return true
}

function fail(response, errorMessage) {
    response.json({
        success : false,
        status: "failed",
        errorMessage : errorMessage
    })
    return true
}

function failIfUndefined(response, field, fieldName) {
    if (field !== undefined) return false
    fail(response, fieldName + " is undefined")
    return true
}

exports.success = success
exports.fail = fail
exports.failIfUndefined = failIfUndefined
