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
                textForLog: true,
                loadFromLogText: true,
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

        textForLog() {
            return JSON.stringify(MemoryArchive.items, null, 4)
        },

        loadFromLogText(logText) {
            MemoryArchive.items = JSON.parse(logText)
        }
    }

    return MemoryArchive
})