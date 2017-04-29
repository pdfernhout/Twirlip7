define([], function() {
    "use strict"

    const LocalStorageArchive = {

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
            localStorage.setItem(localStorage.length, item)
        },

        getItem(index) {
            return localStorage.getItem(index)
        },

        itemCount() {
            return localStorage.length
        },

        textForJournal() {
            const items = []
            for (let i = 0; i < localStorage.length; i++) {
                items.push(LocalStorageArchive.getItem(i))
            }
            return JSON.stringify(items, null, 4)
        },

        loadFromJournalText(journalText) {
            localStorage.clear()
            const items = JSON.parse(journalText)
            for (let item of items) { LocalStorageArchive.addItem(item) }
        }
    }

    return LocalStorageArchive
})