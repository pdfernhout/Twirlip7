define([], function() {
    "use strict"

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
            }
        },

        addItem(item) {
            JournalUsingMemory.items.push(item)
        },

        getItem(index) {
            return JournalUsingMemory.items[index]
        },

        itemCount() {
            return JournalUsingMemory.items.length
        },

        textForJournal() {
            return JSON.stringify(JournalUsingMemory.items, null, 4)
        },

        loadFromJournalText(journalText) {
            JournalUsingMemory.items = JSON.parse(journalText)
        }
    }

    return JournalUsingMemory
})