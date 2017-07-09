// Extend the application with search functionality
// To make this new extension go away, you either need to reload the page or use extensionsUninstall.

const searchResults = []
let searchText = ""

function search() {
    
    searchResults.splice(0)
    const notebook = Twirlip7.getCurrentNotebook()
    if (!searchText) return
    
    function processItem(i, item) {
        if (item && item.indexOf(searchText) !== -1) {
            return notebook.keyForLocation(i).then((key) => {
                searchResults.push({i, key, item})
                return Promise.resolve(null)
            })
        }
        return Promise.resolve(null)
    }
    
    const promises = []
    for (let i = 0; i < notebook.itemCount(); i++) {
        const promise = notebook.getItemForLocation(i).then(processItem.bind(null, i))
        promises.push(promise)
    }
    Promise.all(promises).then(() => m.redraw())
}

Twirlip7.workspaceView.extensionsInstall({
    id: "search-plain",
    // For tags, try header, middle, and footer
    tags: "header",
    code: () => {
        return m("div",
            searchResults.map((result) => {
                return m("div", {
                    title: result.item, 
                    onclick: Twirlip7.workspaceView.goToKey.bind(null, result.key)
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

// Twirlip7.workspaceView.extensionsUninstall({id: "search-plain"})
