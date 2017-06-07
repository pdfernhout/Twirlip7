requirejs.config({
    paths: { ace: ["vendor/ace"] },
    bundles: {
        "vendor/ace/ext-modelist": ["ace/ext/modelist"]
    }
})

requirejs(["vendor/mithril", "WorkspaceView", "JournalUsingLocalStorage", "JournalUsingMemory", "FileUtils", "CanonicalJSON"], function(mDiscardAsMadeGlobal, WorkspaceView, JournalUsingLocalStorage, JournalUsingMemory, FileUtils, CanonicalJSON) {
    "use strict"
    
    /* global location */
    
    function setupTwirlip7Global() {
        // setup Twirlip7 global for use by evaluated code
        if (window.Twirlip7) {
            alert("Unexpected: Twirlip7 global already exists!")
            return
        }
        window.Twirlip7 = {
            show: WorkspaceView.show,
            WorkspaceView,
            FileUtils,
            CanonicalJSON,
            JournalUsingLocalStorage,
            JournalUsingMemory,
            getCurrentJournal: () => {
                return WorkspaceView.currentJournal
            },
            newItem: WorkspaceView.newItem,
            saveItem: (item) => {
                if (!item.timestamp) item.timestamp = new Date().toISOString()
                if (!item.contributor) item.contributor = WorkspaceView.currentContributor
                const itemJSON = CanonicalJSON.stringify(item)
                return WorkspaceView.currentJournal.addItem(itemJSON)
            }
        }
    }

    function runStartupItem(itemId) {
        const item = JournalUsingLocalStorage.getItem(itemId)
        if (item) {
            try {
                const code = (item.startsWith("{")) ? JSON.parse(item).value : item
                eval(code)
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
        
        WorkspaceView.currentContributor = localStorage.getItem("_contributor") || ""
        
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
