// Extend the application with more complex search functionality supporting regex and case-insensitive matches
// Put the extension in the footer so the changing results do not make the editor go up and down on the page.
// If you want this extention to install automatically at startup, check "Bootstrap it".

const searchResults = []
let searchText = ""
let noMatches = false
let matchCase = false
let matchRegex = false
let matchWordBoundary = false

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")
}

function search() {
    searchResults.splice(0)
    if (searchText) {
        const journal = Twirlip7.getCurrentJournal()
        let reString = matchRegex ? searchText : escapeRegExp(searchText)
        if (matchWordBoundary) reString = "\\b" + reString + "\\b"
        const re = new RegExp(reString, matchCase ? "m" : "mi")
        // Display in reverse order so most recent is at top of results
        for (let i = journal.itemCount() - 1; i >= 0; i--) {
            const item = journal.getItemForLocation(i)
            if (item && item.match(re)) {
                const key = journal.keyForLocation(i)
                searchResults.push({i, key, item})
            }
        }
    }
    noMatches = searchText && !searchResults.length
}

function latest() {
    if (searchText) {
        search()
        if (searchResults.length) {
            const latestResult = searchResults[0]
            searchResults.splice(0)
            Twirlip7.WorkspaceView.goToKey(latestResult.key)
        }
    }
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
                onchange: (event) => searchText = event.target.value,
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
            m("button.ma1", { onclick: latest, title: "Load editor with last matching search result" }, "Latest"),
            m("button.ma1", { onclick: search }, "Search"),
            m("span.ma1", { title: "Whether the search is case-sensitive" },
                "case", 
                m("input[type=checkbox].ma1", { checked: matchCase, onchange: (event) => matchCase = event.target.checked })
            ),
            m("span.ma1", { title: "Whether the search uses regular expressions" },
                "regex", 
                m("input[type=checkbox].ma1", { checked: matchRegex, onchange: (event) => matchRegex = event.target.checked })
            ),
            m("span.ma1",  { title: "Whether the search only matches on word boundaries" },
                "word", 
                m("input[type=checkbox].ma1", { checked: matchWordBoundary, onchange: (event) => matchWordBoundary = event.target.checked })
            ),
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
