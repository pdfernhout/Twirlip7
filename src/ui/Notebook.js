define(["vendor/sha256", "vendor/mithril"], function(sha256, mDiscard) {
    "use strict"

    // This elegant style of defining notebooks is "inefficient" of memory
    // compared to sharing function definitions via a common prototype.
    // But, we are only going to have a few notebooks in the application,
    // so the clarity is not very costly
    // (especially compared to megabytes of items in each notebook).
    // See also: https://stackoverflow.com/questions/387707/what-techniques-can-be-used-to-define-a-class-in-javascript-and-what-are-their/1169656#1169656

    function Notebook(store) {

        let itemForLocation = []
        let itemForHash = {}

        let isLoaded = false
        let onLoadedCallback = null

        function getCapabilities() {
            return {
                canClear: !store || !!store.clearItems
            }
        }

        // Returns Promise
        function addItem(item, isAlreadyStored) {
            const reference = "" + sha256.sha256(item)
            const storedItem = itemForHash[reference]
            if (storedItem) {
                return Promise.resolve({ id: reference, location: storedItem.location, existed: true })
            }
            const newLocation = itemForLocation.length
            const newStoredItem = { id: reference, location: newLocation, item: item }
            itemForLocation.push(newStoredItem)
            itemForHash[reference] = newStoredItem
            if (!isAlreadyStored && store) store.addItem(item)
            const result = { id: reference, location: newLocation, existed: false }
            return Promise.resolve(result)
        }

        // Returns Promise
        function getItem(reference) {
            if (reference === null) return Promise.resolve(null)
            const storedItem = itemForHash[reference]
            const result = storedItem ? storedItem.item : null
            return Promise.resolve(result)
            // For testing: Simulate delay; uncomment this and comment above line
            // return new Promise((resolve, reject) => {
            //    setTimeout(() => resolve(result), 400)
            // })
        }

        // Returns Promise
        function getItemForLocation(location) {
            const storedItem = itemForLocation[location]
            const result = storedItem ? storedItem.item : null
            return Promise.resolve(result)
        }

        // Return this value directly
        // Track this separately as it is used a lot and pertains to entire collection
        // Updating this value will also involve a callback about new items
        function itemCount() {
            const result = itemForLocation.length
            return result
        }

        // Returns Promise
        function textForNotebook() {
            const result = []
            for (let i = 0; i < itemForLocation.length; i++) {
                const storedItem = itemForLocation[i]
                result.push(storedItem.item)
            }
            const resultAsJSON = JSON.stringify(result, null, 4)
            return Promise.resolve(resultAsJSON)
        }

        // Returns Promise
        function clearItems() {
            if (store) {
                if (!store.clearItems) {
                    return Promise.reject("clearItems not supported for current store")
                }
                store.clearItems()
            }
            itemForLocation = []
            itemForHash = {}
            return Promise.resolve(true)
        }

        // Returns Promise
        function loadFromNotebookText(notebookText) {
            return clearItems().then(result => {
                const items = JSON.parse(notebookText)
                for (let item of items) { addItem(item) }
                return Promise.resolve(true)
            })
        }

        // Returns Promise
        function locationForKey(key) {
            if (key === null || key === "") return Promise.resolve(null)
            const storedItem = itemForHash[key]
            const result = storedItem ? storedItem.location : null
            return Promise.resolve(result)
        }

        // Returns Promise
        function keyForLocation(location) {
            const storedItem = itemForLocation[location]
            const result = storedItem ? storedItem.id : null
            return Promise.resolve(result)
        }

        // Returns Promise with newLocation
        function skip(start, delta, wrap) {
            const numberOfItems = itemCount()
            if (numberOfItems === 0) return Promise.resolve(null)
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
            return Promise.resolve(newLocation)
        }

        function setup(io) {
            if (store && store.setup) store.setup(io)
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

        const notebook = {
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
            store.connect(notebook)
        } else {
            onLoaded()
        }

        return notebook
    }

    return Notebook
})
