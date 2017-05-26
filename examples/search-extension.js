// Extend the application
// To make this new button go away, you either need to reload the page or use extensionsUninstall

const searchResults = []

function search() {
    searchResults.splice(0)
    const journal = Twirlip7.getCurrentJournal()
    const searchText = prompt("search string")
    if (!searchText) return
    for (let i = 0; i < journal.itemCount(); i++) {
        const item = journal.getItemForLocation(i)
        if (item && item.indexOf(searchText) !== -1) {
            const key = journal.keyForLocation(i)
            console.log("item", i, key)
            searchResults.push({i, key, item})
        }
    }
}

function load(key) {
    Twirlip7.WorkspaceView.currentItemIndex = key
}

Twirlip7.WorkspaceView.extensionsInstall({
    id: "search",
    // For tags, try header, middle, and footer
    tags: "header",
    code: (context) => {
        return m("div",
            searchResults.map((result) => {
                return m("div", {
                    title: result.item, 
                    onclick: Twirlip7.WorkspaceView.goToKey.bind(null, result.key)
                }, "" + (result.i + 1) + ") " + result.item.substring(0, 100) + "...")
            }),
            m("button.ma1", {onclick: search}, "Search")
        )
    }
})

// Twirlip7.WorkspaceView.extensionsUninstall({id: "search"})
