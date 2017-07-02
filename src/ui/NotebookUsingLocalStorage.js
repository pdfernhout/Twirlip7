define(["vendor/sha256"], function(sha256) {
    "use strict"
    /* global localStorage */
    
    const hashToItemPrefix = "_h2i_"
    const hashToLocationPrefix = "_h2l_"
    const locationToHashPrefix = "_l2h_"
    const itemCountKey = "_itemCounter"
    
    const NotebookUsingLocalStorage = {

        getCapabilities() {
            return {
                idIsPosition: false,
                addItem: true,
                getItem: true,
                itemCount: true,
                textForNotebook: true,
                loadFromNotebookText: true,
                skip: true,
            }
        },

        addItem(item) {
            const hash = "" + sha256.sha256(item)
            if (NotebookUsingLocalStorage.getItem(hash)) return { id: hash, existed: true }
            const itemCount = NotebookUsingLocalStorage.itemCount()
            const location = itemCount
            try {
                localStorage.setItem(hashToItemPrefix + hash, item)
                localStorage.setItem(hashToLocationPrefix + hash, "" + location)
                localStorage.setItem(locationToHashPrefix + location, hash)
                localStorage.setItem(itemCountKey, "" + (itemCount + 1))
            } catch (e) {
                // Probably storage is full
                console.log("addItem failed", location, hash, e)
                return { id: null, existed: false, error: e}
            }
            return { id: hash, existed: false }
        },

        getItem(hash) {
            return localStorage.getItem(hashToItemPrefix + hash)
        },
        
        getItemForLocation(location) {
            return NotebookUsingLocalStorage.getItem(localStorage.getItem(locationToHashPrefix + location))
        },
        
        itemCount() {
            const itemCountString = localStorage.getItem(itemCountKey) || "0"
            return parseInt(itemCountString)
        },

        textForNotebook() {
            const itemCount = NotebookUsingLocalStorage.itemCount()
            const items = []
            for (let i = 0; i < itemCount; i++) {
                const item = NotebookUsingLocalStorage.getItemForLocation(i)
                items.push(item)
            }
            return JSON.stringify(items, null, 4)
        },

        clearItems() {
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
        },
        
        loadFromNotebookText(notebookText) {
            NotebookUsingLocalStorage.clearItems()
            const items = JSON.parse(notebookText)
            for (let item of items) { NotebookUsingLocalStorage.addItem(item) }
        },
        
        locationForKey(key) {
            const searchKey = hashToLocationPrefix + key
            const locationString = localStorage.getItem(searchKey)
            if (!locationString) return null
            return parseInt(locationString)
        },
        
        keyForLocation(location) {
            return localStorage.getItem(locationToHashPrefix + location)
        },
        
        skip(reference, delta, wrap) {
            const itemCount = NotebookUsingLocalStorage.itemCount()
            if (itemCount === 0) return null
            let start = (!reference) ? null : NotebookUsingLocalStorage.locationForKey(reference)
            if (start === null) {
                if (wrap) {
                    // when wrapping, want +1 to go to 0 or -1 to go to end
                    if (delta === 0) {
                        start = 0
                    } else if (delta > 0) {
                        start = -1
                    } else {
                        start = itemCount
                    }
                } else {
                    // if not wrapping, negative deltas get us nowhere, and positive deltas go from start
                    start = -1
                }
            }

            let location
            if (wrap) {
                delta = delta % itemCount
                location = (start + delta + itemCount) % itemCount
            } else {
                location = start + delta
                if (location < 0) location = 0
                if (location >= itemCount) location = itemCount - 1
            }
            return NotebookUsingLocalStorage.keyForLocation(location)
        }
    }

    return NotebookUsingLocalStorage
})
