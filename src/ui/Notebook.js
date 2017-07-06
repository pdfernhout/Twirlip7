define(["vendor/sha256", "vendor/mithril"], function(sha256, mDiscard) {
    "use strict"

    // This elegant style of defining notebooks is "inefficient" of memory
    // compared to sharing function definitions via a common prototype.
    // But, we are only going to have a few notebooks in the application,
    // so the clarity is not very costly 
    // (especially compared to megabytes of items in each notebook).
    // See also: https://stackoverflow.com/questions/387707/what-techniques-can-be-used-to-define-a-class-in-javascript-and-what-are-their/1169656#1169656

    function Notebook(store) {
        
        const itemForLocation = []
        const itemForHash = {}
        
        let isLoaded = false
        let onLoadedCallback = null

        function getCapabilities() {
            return {
                canClear: !store || !!store.clearItems
            }
        }

        function addItem(item, isAlreadyStored) {
            const reference = "" + sha256.sha256(item)
            const storedItem = itemForHash[reference]
            if (storedItem) {
                return { id: reference, location: storedItem.location, existed: true }
            }
            const newLocation = itemForLocation.length
            const newStoredItem = { id: reference, location: newLocation, item: item }
            itemForLocation.push(newStoredItem)
            itemForHash[reference] = newStoredItem
            if (!isAlreadyStored && store) store.addItem(item)
            return { id: reference, location: newLocation, existed: false }
        }

        function getItem(reference) {
            if (reference === null) return null
            const storedItem = itemForHash[reference]
            return storedItem ? storedItem.item : null
        }
        
        function getItemForLocation(location) {
            const storedItem = itemForLocation[location]
            return storedItem ? storedItem.item : null
        }

        function itemCount() {
            return itemForLocation.length
        }

        function textForNotebook() {
            const result = []
            for (let i = 0; i < itemForLocation.length; i++) {
                const storedItem = itemForLocation[i]
                result.push(storedItem.item)
            }
            return JSON.stringify(result, null, 4)
        }

        function clearItems() {
            if (store) {
                if (!store.clearItems) {
                    throw new Error("clearItems not supported for current store")
                }
                store.clearItems()
            }
            itemForLocation = []
            itemForHash = {}
        }
        
        function loadFromNotebookText(notebookText) {
            clearItems()
            const items = JSON.parse(notebookText)
            for (let item of items) { addItem(item) }
        }
        
        function locationForKey(key) {
            if (key === null || key === "") return null
            const storedItem = itemForHash[key]
            return storedItem ? storedItem.location : null
        }
        
        function keyForLocation(location) {
            const storedItem = itemForLocation[location]
            return storedItem ? storedItem.id : null
        }
        
        function skip(reference, delta, wrap) {
            const numberOfItems = itemCount()
            if (numberOfItems === 0) return null
            let start = (!reference) ? null : locationForKey(reference)
            if (start === null) {
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

            let location
            if (wrap) {
                delta = delta % numberOfItems
                location = (start + delta + numberOfItems) % numberOfItems
            } else {
                location = start + delta
                if (location < 0) location = 0
                if (location >= numberOfItems) location = numberOfItems - 1
            }
            return keyForLocation(location)
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