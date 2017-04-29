define([], function() {
    "use strict"

    const MemoryArchive = {
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
            MemoryArchive.items.push(item)
        },

        getItem(index) {
            return MemoryArchive.items[index]
        },

        itemCount() {
            return MemoryArchive.items.length
        },

        textForJournal() {
            return JSON.stringify(MemoryArchive.items, null, 4)
        },

        loadFromJournalText(journalText) {
            MemoryArchive.items = JSON.parse(journalText)
        }
    }

    return MemoryArchive
})