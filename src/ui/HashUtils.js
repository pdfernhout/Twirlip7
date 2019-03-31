define([], function() {
    "use strict"

    function getHashParams() {
        // derived from: https://stackoverflow.com/questions/4197591/parsing-url-hash-fragment-identifier-with-javascript
        const hashParams = {}
        const plusRegex = /\+/g  // Regex for replacing addition symbol with a space
        const splitRegex = /([^&;=]+)=?([^&;]*)/g
        const decode = function (text) { return decodeURIComponent(text.replace(plusRegex, " ")) }
        const hash = window.location.hash.substring(1)

        let execResult = true
        while (execResult) {
            execResult = splitRegex.exec(hash)
            if (execResult) hashParams[decode(execResult[1])] = decode(execResult[2])
        }

        return hashParams
    }

    function setHashParams(hashParams) {
        let newHash = ""
        for (let key in hashParams) {
            if (newHash) newHash += "&"
            newHash += encodeURIComponent(key) + "=" + encodeURIComponent(hashParams[key])
        }
        if (window.location.hash.substring(1) !== newHash) {
            window.location.hash = newHash
        }
    }

    return {
        getHashParams,
        setHashParams
    }
})
