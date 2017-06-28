// Extend the application with navigation functionality

let showNavigation = false
let cacheItemCount = 0
let cachedJournal = null
let cache = {}

function processNewJournalItems(callback, startIndex) {
    if (!startIndex) startIndex = 0
    for (let i = startIndex; i < cachedJournal.itemCount(); i++) {
        const item = cachedJournal.getItemForLocation(i)
        if (item) {
            const key = cachedJournal.keyForLocation(i)
            callback({i, key, item:  Twirlip7.getItemForJSON(item) })
        }
    }
}

function addToMap(itemContext) {
    const entity = itemContext.item.entity
    const attribute = itemContext.item.attribute
    let entityInfo = cache["e:" + entity]
    if (!entityInfo) {
        entityInfo = { open: false, entity, attributes: {}, lastItem: null }
        cache["e:" + entity] = entityInfo
    }
    let attributeInfo = entityInfo.attributes["a:" + attribute]
    if (!attributeInfo) {
        attributeInfo = { open: false, attribute, itemsByKey: {}, itemsByOrder: [] }
        entityInfo.attributes["a:" + attribute] = attributeInfo
    }
    if (!attributeInfo.itemsByKey[itemContext.key]) {
        const item = itemContext.item
        // Don't save entire item in case it is big and maybe store is not keeping it in memory
        const itemInfo = { open: false, i: itemContext.i, key: itemContext.key, timestamp: item.timestamp, contributor: item.contributor }
        attributeInfo.itemsByKey[itemContext.key] = itemInfo
        attributeInfo.itemsByOrder.push(itemInfo)
        entityInfo.lastItemInfo = itemInfo
        cacheItemCount++
    }
}

function updateCacheIfNeeded() {
    const currentJournal = Twirlip7.getCurrentJournal()
    if (cachedJournal !== currentJournal) {
        cachedJournal = currentJournal
        cache = {}
        cacheItemCount = 0
    }
    const currentItemCount = cachedJournal.itemCount()
    if (cacheItemCount < currentItemCount) {
        processNewJournalItems(addToMap, cacheItemCount)
    }
}

function load(key) {
    if (!Twirlip7.workspaceView.confirmClear()) return
    Twirlip7.workspaceView.goToKey(key)
}

Twirlip7.workspaceView.extensionsInstall({
    id: "navigation-eav-tree",
    tags: "footer",
    code: (context) => {
        // TODO: Updating the cache should be done outside of view function?
        updateCacheIfNeeded()
        return m("div",
            m("span.i.b", { title: "click to open or close navigation tree", onclick: () => showNavigation = !showNavigation }, "Navigation Entity-Attribute-Value Tree"),
            showNavigation ? 
                Object.keys(cache).sort().map((entityInfoKey) => {
                    const entityInfo = cache[entityInfoKey]
                    const lastItemInfo = entityInfo.lastItemInfo
                    const title = "Go to last added\n" + lastItemInfo.timestamp + "\n" + lastItemInfo.contributor
                    return m("div", 
                        m("span", { onclick: () => entityInfo.open = !entityInfo.open }, entityInfo.open ? "▼" : "►"),
                        m("span.ml3", { title: title , onclick: () => load(lastItemInfo.key) }, entityInfo.entity || m("span.i", "<no entity name>")),
                        entityInfo.open ?
                            Object.keys(entityInfo.attributes).sort().map((attributeInfoKey) => {
                                const attributeInfo = entityInfo.attributes[attributeInfoKey]
                                const lastItemInfo = attributeInfo.itemsByOrder[attributeInfo.itemsByOrder.length - 1]
                                const title = "Go to last added\n" + lastItemInfo.timestamp + "\n" + lastItemInfo.contributor
                                return m("div.ml4",
                                    m("span", { onclick: () => attributeInfo.open = !attributeInfo.open }, attributeInfo.open ? "▼" : "►"),
                                    m("span", { title: title, onclick: () => load(lastItemInfo.key) },
                                        attributeInfo.attribute  || m("span.i", "<no attribute name>")
                                    ),
                                    attributeInfo.open ? 
                                        attributeInfo.itemsByOrder.map((itemInfo) => {
                                            return m("div.ml5", { title: "Go", onclick: () => load(itemInfo.key) },
                                                itemInfo.timestamp,
                                                m("span.ma2"),
                                                itemInfo.contributor
                                            )
                                        }) :
                                        []
                                )
                            }) :
                            []
                    )
                }) :
                []
        )
    }
})

// Twirlip7.workspaceView.extensionsUninstall({id: "navigation"})
