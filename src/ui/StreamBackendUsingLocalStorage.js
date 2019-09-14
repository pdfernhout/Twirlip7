"use strict"
/* global sha256 */

// import sha256 from "./vendor/sha256.js"

const hashToItemPrefix = "_h2i_"
const hashToLocationPrefix = "_h2l_"
const locationToHashPrefix = "_l2h_"
const itemCountKey = "_itemCounter"

export function StreamBackendUsingLocalStorage(redrawCallback) {

    function addItem(item) {
        const hash = "" + sha256(item)
        if (getItem(hash)) return { id: hash, existed: true }
        const numberOfItems = itemCount()
        const location = numberOfItems
        try {
            // TODO: Could simplify this now -- but want to still support legacy streams
            localStorage.setItem(hashToItemPrefix + hash, item)
            localStorage.setItem(hashToLocationPrefix + hash, "" + location)
            localStorage.setItem(locationToHashPrefix + location, hash)
            localStorage.setItem(itemCountKey, "" + (numberOfItems + 1))
        } catch (e) {
            // Probably storage is full
            console.log("addItem failed", location, hash, e)
            return { id: null, existed: false, error: e}
        }
        return { id: hash, existed: false }
    }

    function getItem(hash) {
        return localStorage.getItem(hashToItemPrefix + hash)
    }

    function getItemForLocation(location) {
        return getItem(localStorage.getItem(locationToHashPrefix + location))
    }

    function itemCount() {
        const itemCountString = localStorage.getItem(itemCountKey) || "0"
        return parseInt(itemCountString)
    }

    function clearItems() {
        // record keys to delete first to avoid modifying localStorage when we traverse it
        const keysToDelete = []
        const length = localStorage.length
        for (let i = 0; i < length; i++) {
            const key = localStorage.key(i)
            if (key.startsWith(hashToItemPrefix)
                || key.startsWith(hashToLocationPrefix)
                || key.startsWith(locationToHashPrefix)
                || key === itemCountKey
            ) {
                keysToDelete.push(key)
            }
        }
        for (let key of keysToDelete) {
            localStorage.removeItem(key)
        }
    }

    // TODO: No longer used
    function locationForKey(key) {
        const searchKey = hashToLocationPrefix + key
        const locationString = localStorage.getItem(searchKey)
        if (!locationString) return null
        return parseInt(locationString)
    }

    // TODO: No longer used
    function keyForLocation(location) {
        return localStorage.getItem(locationToHashPrefix + location)
    }

    function connect(responder) {
        const count = itemCount()
        for (let i = 0; i < count; i++) {
            responder.onAddItem(getItemForLocation(i))
        }

        window.addEventListener("storage", function(event) {
            const key = event.key
            if (key.startsWith(hashToItemPrefix)) {
                const newValue = event.newValue
                responder.onAddItem(newValue)
                if (redrawCallback) redrawCallback()
            }
        })

        responder.onLoaded()
        
        // This next redraw is only needed if connect was done other than in an event handler or at startup
        if (redrawCallback) redrawCallback()
    }

    return {
        addItem,
        clearItems,
        connect,
        isSetup: function() { return true }
    }
}
