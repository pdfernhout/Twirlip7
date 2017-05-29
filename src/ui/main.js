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
                return "ok"
            } catch (error) {
                console.log("Error running startup item", itemId)
                console.log("Error message\n", error)
                console.log("Beginning of item contents\n", item.substring(0,500) + (item.length > 500 ? "..." : ""))
                return "failed"
            }
        } else {
            console.log("startup item not found", itemId)
            return "missing"
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
            WorkspaceView.restoreCurrentItemId()
            m.redraw()
            const startupInfo = WorkspaceView.getStartupInfo()
            if (startupInfo.startupItemIds.length) {
                setTimeout(() => {
                    const invalidStartupItems = []
                    for (let startupItemId of startupInfo.startupItemIds) {
                        const status = runStartupItem(startupItemId)
                        if (status !== "ok") {
                            console.log("Removing " +  status + " startup item from bootstrap: ", startupItemId)
                            invalidStartupItems.push(startupItemId)
                        }
                    }
                    if (invalidStartupItems.length) {
                        for (let invalidStartupItemId of invalidStartupItems) {
                            const index = startupInfo.startupItemIds.indexOf(invalidStartupItemId)
                            if (index > -1) startupInfo.startupItemIds.splice(index, 1)
                        }
                        WorkspaceView.setStartupInfo(startupInfo)
                    }
                    m.redraw()
                })
            }
        }, 0)
    }
})
