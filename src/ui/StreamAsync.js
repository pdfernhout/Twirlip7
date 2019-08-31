"use strict"

// import { sha256 } from "./vendor/sha256.js"

/* global sha256 */

// A Stream is an ordered collection of items (JSON objects).
// Each item can be referenced by its zero-based position
// or by the SHA256 of its canoncial JSON representation.
// This stream is stored in memory.
// A backend can be connected to the stream for persistence.

// This version of Stream uses promises

export function Stream(store) {

    let itemForLocation = []
    let itemForHash = {}

    let isLoaded = false
    let onLoadedCallback = null

    function getCapabilities() {
        return {
            canClear: !store || !!store.clearItems
        }
    }

    async function addItem(item, isAlreadyStored) {
        const reference = "" + sha256(item)
        const storedItem = itemForHash[reference]
        if (storedItem) {
            return { id: reference, location: storedItem.location, existed: true }
        }
        const newLocation = itemForLocation.length
        const newStoredItem = { id: reference, location: newLocation, item: item }
        itemForLocation.push(newStoredItem)
        itemForHash[reference] = newStoredItem
        // This might become an await on store.addItem(...) if any store required it
        if (!isAlreadyStored && store) store.addItem(item)
        const result = { id: reference, location: newLocation, existed: false }
        return result
    }

    async function getItem(reference) {
        if (reference === null) return null
        const storedItem = itemForHash[reference]
        const result = storedItem ? storedItem.item : null
        return result
        // For testing: Simulate delay; uncomment this and comment above line
        // return await new Promise(resolve, reject) => {
        //    setTimeout(() => resolve(result), 400)
        // })
    }

    async function getItemForLocation(location) {
        const storedItem = itemForLocation[location]
        const result = storedItem ? storedItem.item : null
        return result
    }

    // Return this value directly
    // Track this separately as it is used a lot and pertains to entire collection
    // Updating this value will also involve a callback about new items
    function itemCount() {
        const result = itemForLocation.length
        return result
    }

    async function textForNotebook() {
        const result = []
        for (let i = 0; i < itemForLocation.length; i++) {
            const storedItem = itemForLocation[i]
            result.push(storedItem.item)
        }
        const resultAsJSON = JSON.stringify(result, null, 4)
        return resultAsJSON
    }

    async function clearItems() {
        if (store) {
            if (!store.clearItems) {
                throw new Error("clearItems not supported for current store")
            }
            // This might need to become an await on store.clearItems() if any store required it
            store.clearItems()
        }
        itemForLocation = []
        itemForHash = {}
        return true
    }

    async function loadFromNotebookText(notebookText) {
        await clearItems()
        const items = JSON.parse(notebookText)
        for (let item of items) { await addItem(item) }
        return true
    }

    async function locationForKey(key) {
        if (key === null || key === "") return null
        const storedItem = itemForHash[key]
        const result = storedItem ? storedItem.location : null
        return result
    }

    async function keyForLocation(location) {
        const storedItem = itemForLocation[location]
        const result = storedItem ? storedItem.id : null
        return result
    }

    // Returns newLocation
    async function skip(start, delta, wrap) {
        const numberOfItems = itemCount()
        if (numberOfItems === 0) return null
        if (start === null || start === undefined) {
            if (wrap) {
                // when wrapping, want +1 to go to 0 or -1 to go to end
                if (delta === 0) {
                    start = 0
                } else if (delta > 0) {
                    start = -1
                } else {
                    start = numberOfItems
                }
            } else {
                // if not wrapping, negative deltas get us nowhere, and positive deltas go from start
                start = -1
            }
        }

        let newLocation
        if (wrap) {
            delta = delta % numberOfItems
            newLocation = (start + delta + numberOfItems) % numberOfItems
        } else {
            newLocation = start + delta
            if (newLocation < 0) newLocation = 0
            if (newLocation >= numberOfItems) newLocation = numberOfItems - 1
        }
        return newLocation
    }

    function setup() {
        if (store && store.setup) store.setup()
    }

    function setOnLoadedCallback(callback) {
        onLoadedCallback = callback
    }

    function onLoaded() {
        if (onLoadedCallback) {
            isLoaded = true
            setTimeout(onLoadedCallback, 0)
            onLoadedCallback = null
        } else {
            isLoaded = true
        }
    }

    const stream = {
        getCapabilities,
        addItem,
        getItem,
        getItemForLocation,
        itemCount,
        textForNotebook,
        clearItems,
        loadFromNotebookText,
        locationForKey,
        keyForLocation,
        skip,
        setup,
        setOnLoadedCallback,
        onLoaded,
        isLoaded: function () {
            return isLoaded
        },
        isAvailable: function () {
            return !store || store.isSetup()
        }
    }

    if (store) {
        store.connect(stream)
    } else {
        onLoaded()
    }

    return stream
}
