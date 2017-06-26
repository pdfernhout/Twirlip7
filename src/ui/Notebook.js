define(["vendor/sha256", "vendor/mithril"], function(sha256, mDiscard) {
    "use strict"

    // This elegant style of defining notebooks is "inefficient" of memory
    // compared to sharing function definitions via a common prototype.
    // But, we are only going to have a few notebooks in the application,
    // so the clarity is not very costly 
    // (especially compared to megabytes of items in each notebook).
    // See also: https://stackoverflow.com/questions/387707/what-techniques-can-be-used-to-define-a-class-in-javascript-and-what-are-their/1169656#1169656
    
    // TODO: This is just all derived from JournalUsingMemory.js -- improve
    
    function Notebook() {
        
        const itemForLocation = []
        const itemForHash = {}

        function getCapabilities() {
            return {
                idIsPosition: false,
                addItem: true,
                getItem: true,
                itemCount: true,
                textForJournal: true,
                loadFromJournalText: true,
                skip: true,
            }
        }

        function addItem(item) {
            const reference = "" + sha256.sha256(item)
            const storedItem = itemForHash[reference]
            if (storedItem) {
                return { id: reference, location: storedItem.location, existed: true }
            }
            const newLocation = itemForLocation.length
            const newStoredItem = { id: reference, location: newLocation, item: item }
            itemForLocation.push(newStoredItem)
            itemForHash[reference] = newStoredItem
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

        function textForJournal() {
            const result = []
            for (let i = 0; i < itemForLocation.length; i++) {
                const storedItem = itemForLocation[i]
                result.push(storedItem.item)
            }
            return JSON.stringify(result, null, 4)
        }

        function clearItems() {
            itemForLocation = []
            itemForHash = {}
        }
        
        function loadFromJournalText(journalText) {
            clearItems()
            const items = JSON.parse(journalText)
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
            const itemCount = itemCount()
            if (itemCount === 0) return null
            let start = (!reference) ? null : locationForKey(reference)
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
            return keyForLocation(location)
        }
        
        return {
            getCapabilities,
            addItem,
            getItem,
            getItemForLocation,
            itemCount,
            textForJournal,
            clearItems,
            loadFromJournalText,
            locationForKey,
            keyForLocation,
            skip
        }
    }
    
    return Notebook
})