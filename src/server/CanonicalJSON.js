
// FROM Apache-licensed: https://github.com/cyberphone/json-canonicalization
// See also: https://github.com/mirkokiefer/canonical-json/issues/11

"use strict"
/* eslint-env node */
/* jslint node: true */

// TODO: Unify with version in UI -- but they need different export styles

const canonicalize = function(object) {
    var buffer = ""
    serialize(object)
    return buffer
    
    function serialize(object) {
        if (object !== null && typeof object === "object") {
            if (Array.isArray(object)) {
                buffer += "["
                let next = false
                // Array - Maintain element order
                object.forEach((element) => {
                    if (next) {
                        buffer += ","
                    }
                    next = true
                    // Recursive call
                    serialize(element)
                })
                buffer += "]"
            } else {
                buffer += "{"
                let next = false
                // Object - Sort properties before serializing
                Object.keys(object).sort().forEach((property) => {
                    if (next) {
                        buffer += ","
                    }
                    next = true
                    // Properties are just strings - Use ES6
                    buffer += JSON.stringify(property)
                    buffer += ":"
                    // Recursive call
                    serialize(object[property])
                })
                buffer += "}"
            }
        } else {
            // Primitive data type - Use ES6
            buffer += JSON.stringify(object)
        }
    }
}

const CanonicalJSON = {
    stringify: canonicalize
}

module.exports = CanonicalJSON
