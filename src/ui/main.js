requirejs.config({
    paths: { ace: ["vendor/ace"] },
    bundles: {
        "vendor/ace/ext-modelist": ["ace/ext/modelist"]
    }
})

requirejs(["vendor/mithril", "WorkspaceView", "JournalUsingLocalStorage", "JournalUsingMemory", "FileUtils"], function(mDiscardAsMadeGlobal, WorkspaceView, JournalUsingLocalStorage, JournalUsingMemory, FileUtils) {
    "use strict"
    
    /* global location */
    
    function setupTwirlip7Global() {
        // setup Twirlip7 global for use by evaluated code
        if (!window.Twirlip7) {
            window.Twirlip7 = {}
            if (!window.Twirlip7.show) window.Twirlip7.show = WorkspaceView.show
            if (!window.Twirlip7.WorkspaceView) window.Twirlip7.WorkspaceView = WorkspaceView
            if (!window.Twirlip7.FileUtils) window.Twirlip7.FileUtils = FileUtils
            if (!window.Twirlip7.JournalUsingLocalStorage) window.Twirlip7.JournalUsingLocalStorage = JournalUsingLocalStorage
            if (!window.Twirlip7.JournalUsingMemory) window.Twirlip7.JournalUsingMemory = JournalUsingMemory
            if (!window.Twirlip7.getCurrentJournal) {
                window.Twirlip7.getCurrentJournal = () => {
                    return WorkspaceView.currentJournal
                }
            }
        }
    }

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
    
    function runAllStartupItems() {
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
                    // disable any invalid startup items
                    for (let invalidStartupItemId of invalidStartupItems) {
                        const index = startupInfo.startupItemIds.indexOf(invalidStartupItemId)
                        if (index > -1) startupInfo.startupItemIds.splice(index, 1)
                    }
                    WorkspaceView.setStartupInfo(startupInfo)
                }
                m.redraw()
            })
        }
    }
    
    function startup() {
        setupTwirlip7Global()
        
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
                runAllStartupItems()
            }, 0)
        }
    }
    
    startup()
})
