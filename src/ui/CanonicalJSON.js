// Derived from: https://github.com/mirkokiefer/canonical-json/blob/master/index2.js
// Note that this approach depends on object keys maintaining their order,
// which is not guaranteed by the JavaScript standards but most browsers support it

/* global module */

// Use UMD pattern so this is accessible by UI via RequireJS or Server via Node.js

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        // AMD
        define([], factory)
    } else if (typeof exports === "object") {
        // Node, CommonJS-like
        module.exports = factory()
    } else {
        // Browser globals (root is window)
        root.CanonicalJSON = factory()
    }
}(this, function () {
    function isObject(a) {
        return Object.prototype.toString.call(a) === "[object Object]"
    }

    function copyObjectWithSortedKeys(object) {
        if (isObject(object)) {
            var newObj = {}
            var keysSorted = Object.keys(object).sort()
            var key
            for (var i = 0, len = keysSorted.length; i < len; i++) {
                key = keysSorted[i]
                newObj[key] = copyObjectWithSortedKeys(object[key])
            }
            return newObj
        } else if (Array.isArray(object)) {
            return object.map(copyObjectWithSortedKeys)
        } else {
            return object
        }
    }

    return {
        stringify: function(object) {
            return JSON.stringify(copyObjectWithSortedKeys(object))
        }
    }
}))