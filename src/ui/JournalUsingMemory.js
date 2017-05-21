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
            const location = JournalUsingMemory.items.length
            JournalUsingMemory.items.push(item)
            return { id: "" + (location + 1), added: true }
        },

        getItem(reference) {
            if (reference === null) return ""
            const location = parseFloat(reference) - 1
            return JournalUsingMemory.items[location]
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
        
        skip(reference, delta, wrap) {
            const itemCount = JournalUsingMemory.itemCount()
            if (itemCount === 0) return null
            const start = (!reference || reference === "0") ? 
                // convoluted start if reference is null or empty or 0, 
                // since want +1 to go to 0 or -1 to go to end
                ((delta <= 0) ? 0 : itemCount - 1) :
                parseInt(reference) - 1
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