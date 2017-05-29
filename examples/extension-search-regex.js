// Extend the application with more complex search functionality supporting regex and case-insenstive matches
// Put the extension in the footer so the changing results do not make the editor go up and down on the page.
// To make this new extension go away, you either need to reload the page or use extensionsUninstall.
// If you want this extention to install automatically at startup, check "Bootstrap it".

const searchResults = []
let searchText = ""
let noMatches = false
let matchCase = false
let matchRegex = false

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
}

function search() {
    searchResults.splice(0)
    const journal = Twirlip7.getCurrentJournal()
    if (searchText) {
        const reString = matchRegex ? searchText : escapeRegExp(searchText)
        const re = new RegExp(reString, matchCase ? "m" : "mi")
        for (let i = 0; i < journal.itemCount(); i++) {
            const item = journal.getItemForLocation(i)
            if (item && item.match(re)) {
                const key = journal.keyForLocation(i)
                searchResults.push({i, key, item})
            }
        }
    }
    noMatches = searchText && !searchResults.length
}

function clearResults() {
    searchResults.splice(0)
    noMatches = false
}

function load(key) {
    Twirlip7.WorkspaceView.currentItemId = key
}

Twirlip7.WorkspaceView.extensionsInstall({
    id: "search-regex",
    // For tags, try header, middle, and footer
    tags: "footer",
    code: (context) => {
        return m("div",
            m("hr"),
            "Find items matching:",
            m("input.ma1", {
                value: searchText,
                onkeydown: (event) => {
                    searchText = event.target.value
                    if (event.keyCode === 13) {
                        search()
                    } else {
                        // Prevent excessive redrawing for every keypress in input field
                        event.redraw = false
                    }
                }
            }),
            m("button.ma1", {onclick: search}, "Search"),
            m("span.ma1"),
            "case", 
            m("input[type=checkbox].ma1", { checked: matchCase, onchange: (event) => matchCase = event.target.checked }),
            m("span.ma1"),
            "regex", 
            m("input[type=checkbox].ma1", { checked: matchRegex, onchange: (event) => matchRegex = event.target.checked }),
            m("button.ma1", {onclick: clearResults }, "Clear results"),
            searchResults.map((result) => {
                return m("div", {
                    title: result.item, 
                    onclick: Twirlip7.WorkspaceView.goToKey.bind(null, result.key)
                }, "" + (result.i + 1) + ") " + result.item.substring(0, 120) + "...")
            }),
            noMatches ? m("div", "No matches") : [],
            m("hr")
        )
    }
})

// Twirlip7.WorkspaceView.extensionsUninstall({id: "search-regex"})
