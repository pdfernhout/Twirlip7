define(["vendor/sha256"], function(sha256) {
    "use strict"

    // returns position + 1 for item reference to avoid first item being "0"
    const NotebookUsingMemory = {
        itemForLocation: [],
        itemForHash: {},

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
            const reference = "" + sha256.sha256(item)
            const storedItem = NotebookUsingMemory.itemForHash[reference]
            if (storedItem) {
                return { id: reference, location: storedItem.location, existed: true }
            }
            const newLocation = NotebookUsingMemory.itemForLocation.length
            const newStoredItem = { id: reference, location: newLocation, item: item }
            NotebookUsingMemory.itemForLocation.push(newStoredItem)
            NotebookUsingMemory.itemForHash[reference] = newStoredItem
            return { id: reference, location: newLocation, existed: false }
        },

        getItem(reference) {
            if (reference === null) return null
            const storedItem = NotebookUsingMemory.itemForHash[reference]
            return storedItem ? storedItem.item : null
        },
        
        getItemForLocation(location) {
            const storedItem = NotebookUsingMemory.itemForLocation[location]
            return storedItem ? storedItem.item : null
        },

        itemCount() {
            return NotebookUsingMemory.itemForLocation.length
        },

        textForNotebook() {
            const result = []
            for (let i = 0; i < NotebookUsingMemory.itemForLocation.length; i++) {
                const storedItem = NotebookUsingMemory.itemForLocation[i]
                result.push(storedItem.item)
            }
            return JSON.stringify(result, null, 4)
        },

        clearItems() {
            NotebookUsingMemory.itemForLocation = []
            NotebookUsingMemory.itemForHash = {}
        },
        
        loadFromNotebookText(notebookText) {
            NotebookUsingMemory.clearItems()
            const items = JSON.parse(notebookText)
            for (let item of items) { NotebookUsingMemory.addItem(item) }
        },
        
        locationForKey(key) {
            if (key === null || key === "") return null
            const storedItem = NotebookUsingMemory.itemForHash[key]
            return storedItem ? storedItem.location : null
        },
        
        keyForLocation(location) {
            const storedItem = NotebookUsingMemory.itemForLocation[location]
            return storedItem ? storedItem.id : null
        },
        
        skip(reference, delta, wrap) {
            const itemCount = NotebookUsingMemory.itemCount()
            if (itemCount === 0) return null
            let start = (!reference) ? null : NotebookUsingMemory.locationForKey(reference)
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
            return NotebookUsingMemory.keyForLocation(location)
        }
    }

    return NotebookUsingMemory
})