define([], function() {
    "use strict"

    // returns position + 1 for item reference to avoid first item being "0"
    const JournalUsingMemory = {
        items: [],

        getCapabilities() {
            return {
                idIsPosition: true,
                addItem: true,
                getItem: true,
                itemCount: true,
                textForJournal: true,
                loadFromJournalText: true,
                skip: true,
            }
        },

        addItem(item) {
            for (let i = 0; i < JournalUsingMemory.items.length; i++) {
                if (item === JournalUsingMemory.items[i]) {
                    return { id: "" + (i + 1), existed: true }
                }
            }
            const location = JournalUsingMemory.items.length
            JournalUsingMemory.items.push(item)
            return { id: "" + (location + 1), existed: false }
        },

        getItem(reference) {
            if (reference === null) return ""
            const location = parseFloat(reference) - 1
            return JournalUsingMemory.items[location]
        },
        
        getItemForLocation(location) {
            return JournalUsingMemory.getItem("" + (location + 1))
        },

        itemCount() {
            return JournalUsingMemory.items.length
        },

        textForJournal() {
            return JSON.stringify(JournalUsingMemory.items, null, 4)
        },

        loadFromJournalText(journalText) {
            JournalUsingMemory.items = JSON.parse(journalText)
        },
        
        locationForKey(key) {
            return parseInt(key) - 1
        },
        
        keyForLocation(location) {
            return "" + (location + 1)
        },
        
        skip(reference, delta, wrap) {
            const itemCount = JournalUsingMemory.itemCount()
            if (itemCount === 0) return null
            let start = (!reference || reference === "0") ? null : parseInt(reference) - 1
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
            
            let location = start + delta
            if (wrap) {
                delta = delta % itemCount
                location = (start + delta + itemCount) % itemCount
            } else {
                if (location < 0) location = 0
                if (location >= itemCount) location = itemCount - 1
            }
            return "" + (location + 1)
        }
    }

    return JournalUsingMemory
})