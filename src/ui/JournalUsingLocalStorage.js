define(["vendor/sha256"], function(sha256) {
    "use strict"
    /* global localStorage */
    
    const hashToItemPrefix = "h2i_"
    const hashToLocationPrefix = "h2l_"
    const locationToHashPrefix = "l2h_"
    
    const JournalUsingLocalStorage = {

        getCapabilities() {
            return {
                idIsPosition: false,
                addItem: true,
                getItem: true,
                itemCount: true,
                textForJournal: true,
                loadFromJournalText: true,
                skip: true,
            }
        },

        addItem(item) {
            const hash = "" + sha256.sha256(item)
            if (JournalUsingLocalStorage.getItem(hash)) return hash
            const itemCount = JournalUsingLocalStorage.itemCount()
            const location = itemCount
            try {
                localStorage.setItem(hashToItemPrefix + hash, item)
                localStorage.setItem(hashToLocationPrefix + hash, "" + location)
                localStorage.setItem(locationToHashPrefix + location, hash)
                localStorage.setItem("_itemCount", "" + (itemCount + 1))
            } catch (e) {
                // Probably storage is full
                console.log("addItem failed", location, hash, e)
                return null
            }
            return hash
        },

        getItem(hash) {
            return localStorage.getItem(hashToItemPrefix + hash)
        },
        
        getItemForLocation(location) {
            return JournalUsingLocalStorage.getItem(localStorage.getItem(locationToHashPrefix + location))
        },
        
        itemCount() {
            const itemCountString = localStorage.getItem("_itemCount") || "0"
            return parseInt(itemCountString)
        },

        textForJournal() {
            const itemCount = JournalUsingLocalStorage.itemCount()
            const items = []
            for (let i = 0; i < itemCount; i++) {
                const item = JournalUsingLocalStorage.getItemForLocation(i)
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
                    || key === "_itemCount"
                ) {
                    keysToDelete.push(key)
                }
            }
            for (let key of keysToDelete) {
                localStorage.removeItem(key)
            }
        },
        
        loadFromJournalText(journalText) {
            JournalUsingLocalStorage.clearItems()
            const items = JSON.parse(journalText)
            for (let item of items) { JournalUsingLocalStorage.addItem(item) }
        },
        
        locationForKey(key) {
            const searchKey = hashToLocationPrefix + key
            const locationString = localStorage.getItem(searchKey)
            if (!locationString) return null
            return parseInt(locationString)
        },
        
        skip(reference, delta, wrap) {
            // TODO: Need to fix this so can skip over non-prefixed items if store other information
            const itemCount = JournalUsingLocalStorage.itemCount()
            if (itemCount === 0) return null
            let start = (!reference) ? 
                // convoluted start if reference is null or empty, 
                // since want +1 to go to 0 or -1 to go to end
                ((delta <= 0) ? 0 : itemCount - 1) :
                JournalUsingLocalStorage.locationForKey(reference)
            if (start === null) start = 0
            let location
            if (wrap) {
                delta = delta % itemCount
                location = (start + delta + itemCount) % itemCount
            } else {
                location = start + delta
                if (location < 0) location = 0
                if (location >= itemCount) location = itemCount - 1
            }
            return localStorage.getItem(locationToHashPrefix + location)
        }
    }

    return JournalUsingLocalStorage
})