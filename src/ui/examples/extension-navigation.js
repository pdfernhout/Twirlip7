// Extend the application with navigation functionality

let showNavigation = false
let cacheItemCount = 0
const cache = {}

function processNewJournalItems(callback, startIndex) {
    if (!startIndex) startIndex = 0
    const journal = Twirlip7.getCurrentJournal()
    for (let i = startIndex; i < journal.itemCount(); i++) {
        const item = journal.getItemForLocation(i)
        if (item) {
            const key = journal.keyForLocation(i)
            callback({i, key, item: JSON.parse(item)})
        }
    }
}

function addToMap(itemContext) {
    const entity = itemContext.item.entity
    const attribute = itemContext.item.attribute
    let entityInfo = cache["e:" + entity]
    if (!entityInfo) {
        entityInfo = { entity, attributes: {} }
        cache["e:" + entity] = entityInfo
    }
    let attributeInfo = entityInfo.attributes["a:" + attribute]
    if (!attributeInfo) {
        attributeInfo = { attribute, itemsByKey: {}, itemsByOrder: [], open: false }
        entityInfo.attributes["a:" + attribute] = attributeInfo
    }
    if (!attributeInfo.itemsByKey[itemContext.key]) {
        const item = itemContext.item
        // Don't save entire item in case it is big and maybe store is not keeping it in memory
        const itemInfo = { open: false, i: itemContext.i, key: itemContext.key, timestamp: item.timestamp, contributor: item.contributor }
        attributeInfo.itemsByKey[itemContext.key] = itemInfo
        attributeInfo.itemsByOrder.push(itemInfo)
        cacheItemCount++
    }
}

function updateCacheIfNeeded() {
    const currentItemCount = Twirlip7.getCurrentJournal().itemCount()
    if (cacheItemCount < currentItemCount) {
        processNewJournalItems(addToMap, cacheItemCount)
    }
}

function load(key) {
    console.log("load", key)
    if (!Twirlip7.WorkspaceView.confirmClear()) return
    Twirlip7.WorkspaceView.goToKey(key)
}

Twirlip7.WorkspaceView.extensionsInstall({
    id: "navigation",
    tags: "footer",
    code: (context) => {
        // TODO: Updating the cache should be done outside of view function?
        updateCacheIfNeeded()
        return m("div",
            m("span.i.b", { title: "click to open or close navigation", onclick: () => showNavigation = !showNavigation }, "Item Navigation"),
            showNavigation ? 
                Object.keys(cache).sort().map((entityInfoKey) => {
                    const entityInfo = cache[entityInfoKey]
                    return m("div", 
                        m("span.ml2", { onclick: () => entityInfo.open = !entityInfo.open }, entityInfo.entity || "<no entity name>"),
                        entityInfo.open ?
                            Object.keys(entityInfo.attributes).sort().map((attributeInfoKey) => {
                                const attributeInfo = entityInfo.attributes[attributeInfoKey]
                                const lastItemInfo = attributeInfo.itemsByOrder[attributeInfo.itemsByOrder.length - 1]
                                const title = "Go to last added\n" + lastItemInfo.timestamp + "\n" + lastItemInfo.contributor
                                return m("div.ml3",
                                    m("span", { title: title, onclick: () => load(lastItemInfo.key) },
                                        attributeInfo.attribute  || "<no attribute name>"
                                    )
                                )
                            }) :
                            []
                    )
                }) :
                []
        )
    }
})

// Twirlip7.WorkspaceView.extensionsUninstall({id: "navigation"})
