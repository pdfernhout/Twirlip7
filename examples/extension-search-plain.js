// Extend the application with search functionality
// To make this new extension go away, you either need to reload the page or use extensionsUninstall.
// If you want this extention to install automatically at startup, check "Bootstrap it".

const searchResults = []
let searchText = ""

function search() {
    searchResults.splice(0)
    const journal = Twirlip7.getCurrentJournal()
    if (!searchText) return
    for (let i = 0; i < journal.itemCount(); i++) {
        const item = journal.getItemForLocation(i)
        if (item && item.indexOf(searchText) !== -1) {
            const key = journal.keyForLocation(i)
            searchResults.push({i, key, item})
        }
    }
}

function load(key) {
    Twirlip7.WorkspaceView.currentItemId = key
}

Twirlip7.WorkspaceView.extensionsInstall({
    id: "search-plain",
    // For tags, try header, middle, and footer
    tags: "header",
    code: (context) => {
        return m("div",
            searchResults.map((result) => {
                return m("div", {
                    title: result.item, 
                    onclick: Twirlip7.WorkspaceView.goToKey.bind(null, result.key)
                }, "" + (result.i + 1) + ") " + result.item.substring(0, 120) + "...")
            }),
            "Find items matching:",
            m("input.ma1", { value: searchText, onchange: (event) => searchText = event.target.value }),
            m("button.ma1", {onclick: search}, "Search"),
            m("button.ma1", {onclick: () => searchResults.splice(0)}, "Clear results"),
            m("hr")
        )
    }
})

// Twirlip7.WorkspaceView.extensionsUninstall({id: "search-plain"})
