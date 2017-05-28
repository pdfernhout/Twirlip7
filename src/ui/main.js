requirejs.config({
    paths: { ace: ["vendor/ace"] },
    bundles: {
        "vendor/ace/ext-modelist": ["ace/ext/modelist"]
    }
})

requirejs(["vendor/mithril", "WorkspaceView", "JournalUsingLocalStorage"], function(mDiscardAsMadeGlobal, WorkspaceView, JournalUsingLocalStorage) {
    "use strict"
    
    /* global location */
    
    function runStartupItem(itemId) {
        const item = JournalUsingLocalStorage.getItem(itemId)
        if (item) {
            try {
                eval(item)
            } catch (error) {
                console.log("Error running startup item", itemId)
                console.log("Error message\n", error)
                console.log("Beginning of item contents\n", item.substring(0,500) + (item.length > 500 ? "..." : ""))
            }
        } else {
            console.log("startup item not found", itemId)
        }
    }
    
    const hash = location.hash
    
    if (hash && hash.startsWith("#open=")) {
        const startupItemId = hash.substring(6)
        runStartupItem(startupItemId)
    } else {
        const root = document.body
        m.mount(root, WorkspaceView)
        setTimeout(() => {
            WorkspaceView.restoreCurrentItemIndex()
            m.redraw()
            const startupItemId = localStorage.getItem("_startupItemId")
            if (startupItemId) {
                setTimeout(() => {
                    runStartupItem(startupItemId)
                    m.redraw()
                })
            }
        }, 0)
    }
})
