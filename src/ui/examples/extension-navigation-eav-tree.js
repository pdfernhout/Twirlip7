// Extend the application with navigation functionality

let showNavigation = false
let cacheItemCount = 0
let cachedNotebook = null
let cache = {}

function processNewNotebookItems(callback, startIndex) {
    if (!startIndex) startIndex = 0
    for (let i = startIndex; i < cachedNotebook.itemCount(); i++) {
        const item = cachedNotebook.getItemForLocation(i)
        if (item) {
            const key = cachedNotebook.keyForLocation(i)
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
    const currentNotebook = Twirlip7.getCurrentNotebook()
    if (cachedNotebook !== currentNotebook) {
        cachedNotebook = currentNotebook
        cache = {}
        cacheItemCount = 0
    }
    const currentItemCount = cachedNotebook.itemCount()
    if (cacheItemCount < currentItemCount) {
        processNewNotebookItems(addToMap, cacheItemCount)
    }
}

// TODO: If click on link when you have unsaved changes and pick cancel in the warning, the hash is still updated
function view() {
    // TODO: Updating the cache should be done outside of view function?
    updateCacheIfNeeded()
    return m("div",
        m("span.i.b", { title: "click to open or close navigation tree", onclick: () => showNavigation = !showNavigation }, showNavigation ? "▼" : "►", "EAV Navigation Tree", Twirlip7.icon("fa-tree.ml1")),
        showNavigation ? 
            Object.keys(cache).sort().map((entityInfoKey) => {
                const entityInfo = cache[entityInfoKey]
                const lastItemInfo = entityInfo.lastItemInfo
                const title = "Go to last added\n" + lastItemInfo.timestamp + "\n" + lastItemInfo.contributor
                return m("div.ml3",
                    m("span", { onclick: () => entityInfo.open = !entityInfo.open }, entityInfo.open ? "▼" : "►"),
                    m("span.ml1", 
                        m("a.link.underline-hover", { href: "#item=" + lastItemInfo.key, title: title }, entityInfo.entity || m("span.i", "<no entity name>"))
                    ),
                    entityInfo.open ?
                        Object.keys(entityInfo.attributes).sort().map((attributeInfoKey) => {
                            const attributeInfo = entityInfo.attributes[attributeInfoKey]
                            const lastItemInfo = attributeInfo.itemsByOrder[attributeInfo.itemsByOrder.length - 1]
                            const title = "Go to last added\n" + lastItemInfo.timestamp + "\n" + lastItemInfo.contributor
                            return m("div.ml3",
                                m("span", { onclick: () => attributeInfo.open = !attributeInfo.open }, attributeInfo.open ? "▼" : "►"),
                                m("span.ml1", 
                                    m("a.link.underline-hover", { href: "#item=" + lastItemInfo.key, title: title }, attributeInfo.attribute  || m("span.i", "<no attribute name>"))
                                ),
                                attributeInfo.open ? 
                                    attributeInfo.itemsByOrder.map((itemInfo) => {
                                        return m("div.ml4",
                                            m("a.link.underline-hover", { href: "#item=" + itemInfo.key }, 
                                                itemInfo.timestamp,
                                                " ",
                                                itemInfo.contributor
                                            )
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

Twirlip7.workspaceView.extensionsInstall({
    id: "navigation-eav-tree",
    tags: "footer",
    code: view
})

// Twirlip7.workspaceView.extensionsUninstall({id: "navigation"})

// Twirlip7.show(view, { title: "EAV Navigation" })
