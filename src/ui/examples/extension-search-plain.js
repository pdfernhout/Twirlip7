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
            const key = notebook.keyForLocation(i)
            searchResults.push({i, key, item})
            return null
        }
        return null
    }
    
    for (let i = 0; i < notebook.itemCount(); i++) {
        const item = notebook.getItemForLocation(i)
        processItem(i, item)
    }
    m.redraw()
}

Twirlip7.notebookView.extensionsInstall({
    id: "search-plain",
    // For tags, try header, middle, and footer
    tags: "header",
    code: () => {
        return m("div",
            searchResults.map((result) => {
                return m("div", {
                    title: result.item, 
                    onclick: Twirlip7.notebookView.goToKey.bind(null, result.key)
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

// Twirlip7.notebookView.extensionsUninstall({id: "search-plain"})
