requirejs.config({
    paths: { ace: ["vendor/ace"] },
    bundles: {
        "vendor/ace/ext-modelist": ["ace/ext/modelist"]
    }
})

requirejs(["vendor/mithril", "WorkspaceView", "JournalUsingLocalStorage", "JournalUsingMemory", "JournalUsingServer", "FileUtils", "CanonicalJSON"], function(mDiscardAsMadeGlobal, WorkspaceView, JournalUsingLocalStorage, JournalUsingMemory, JournalUsingServer, FileUtils, CanonicalJSON) {
    "use strict"
    
    /* global location */
    
    let initialKeyToGoTo = null

    function getItemForJSON(itemJSON) {
        if (itemJSON === null) return null
        if (itemJSON.startsWith("{")) {
            try {
                return JSON.parse(itemJSON)
            } catch(e) {
                // fall through
            }
        }
        const newItem = WorkspaceView.newItem()
        newItem.value = itemJSON
        return newItem
    }
    
    function setupTwirlip7Global(callback) {
        // setup Twirlip7 global for use by evaluated code
        if (window.Twirlip7) {
            alert("Unexpected: Twirlip7 global already exists!")
            callback()
            return
        }
        window.Twirlip7 = {
            show: WorkspaceView.show,
            WorkspaceView,
            FileUtils,
            CanonicalJSON,
            JournalUsingLocalStorage,
            JournalUsingMemory,
            JournalUsingServer,
            getCurrentJournal: () => {
                return WorkspaceView.currentJournal
            },
            getItemForJSON: getItemForJSON,
            newItem: WorkspaceView.newItem,
            saveItem: (item) => {
                if (!item.timestamp) item.timestamp = new Date().toISOString()
                if (!item.contributor) item.contributor = WorkspaceView.currentContributor
                const itemJSON = CanonicalJSON.stringify(item)
                return WorkspaceView.currentJournal.addItem(itemJSON)
            },
            findItem(match) {
                // TODO: This extremely computationally inefficient placeholder needs to be improved
                // TODO: This should not have to iterate over all stored objects
                const result = []
                const journal = WorkspaceView.currentJournal
                const count = journal.itemCount()
                for (let i = 0; i < count; i++) {
                    const itemJSON = journal.getItemForLocation(i)
                    const item = getItemForJSON(itemJSON)
                    if (!item) continue
                    let isMatch = true
                    for (let key in match) {
                        if (item[key] !== match[key]) {
                            isMatch = false
                            continue
                        }
                    }
                    if (isMatch) result.push({i, item})
                }
                // Sort so later items are earlier in list
                result.sort((a, b) => {
                    if (a.item.timestamp < b.item.timestamp) return 1
                    if (a.item.timestamp > b.item.timestamp) return -1
                    // compare on triple hash if timestamps match
                    const aHash = journal.keyForLocation(a.i)
                    const bHash = journal.keyForLocation(b.i)
                    if (aHash < bHash) return 1
                    if (aHash > bHash) return -1
                    // Should never get here unless incorrectly storing duplicates
                    console.log("duplicate item error", a, b)
                    return 0
                })
                return result.map(match => match.item)
            }
        }
        
        // Try to load socket.io, which may fail
        requirejs(["/socket.io/socket.io.js"], function(io) {
            JournalUsingServer.onLoadedCallback = function() {
                console.log("done reading data from server")
                // assuming callback will always be done before get here to go to initialKeyToGoTo
                if (initialKeyToGoTo && WorkspaceView.journalChoice === "server") WorkspaceView.goToKey(initialKeyToGoTo)
                m.redraw()
            }
            JournalUsingServer.setup(io)
            callback()
            console.log("started reading data from server")
        }, function(err) {
            console.log("No socket.io available -- server function disabled")
            callback()
        })
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
    
    function startEditor(postMountCallback, preMountCallback) {
        if (preMountCallback) preMountCallback()
        const root = document.body
        m.mount(root, WorkspaceView) 
        setTimeout(() => {
            if (postMountCallback) {
                postMountCallback()
                m.redraw()
            }
            runAllStartupItems()
            window.addEventListener("hashchange", () =>  hashChange, false)
        }, 0)
    }
    
    function hashChange(event) {
        const hash = location.hash
        // do our own routing and ignore things that don't match in case other evaluated code is using Mithril's router
        if (hash && hash.startsWith("#item=")) {
            const itemId = hash.substring("#item=".length)
            WorkspaceView.goToKey(itemId)
        }        
    }
    
    window.addEventListener("hashchange", hashChange, false)
    
    function startup() {
        setupTwirlip7Global(() => {
        
            WorkspaceView.currentContributor = localStorage.getItem("_contributor") || ""
            
            const hash = location.hash
            if (hash && hash.startsWith("#open=")) {
                const startupItemId = hash.substring("#open=".length)
                runStartupItem(startupItemId)
            } else if (hash && hash.startsWith("#item=")) {
                const itemId = hash.substring("#item=".length)
                initialKeyToGoTo = itemId
                startEditor(() => {
                    if (initialKeyToGoTo && WorkspaceView.journalChoice !== "server") WorkspaceView.goToKey(initialKeyToGoTo)
                }, () => {
                    WorkspaceView.restoreJournalChoice()
                })
            } else if (hash && hash.startsWith("#eval=")) {
                // TODO: Not sure whether to restore journal choice here
                const startupSelection = hash.substring("#eval=".length)
                const startupFileNames = startupSelection.split(";")
                for (let startupFileName of startupFileNames) {
                    requirejs(["vendor/text!" + startupFileName], function (startupFileContents) {
                        eval(startupFileContents)
                    })
                }
            } else if (hash && hash.startsWith("#edit=")) {
                // TODO: Not sure whether to restore journal choice here
                const startupSelection = hash.substring("#edit=".length)
                requirejs(["vendor/text!" + startupSelection], function (startupFileContents) {
                    startEditor(() => {
                        WorkspaceView.currentItem.entity = startupSelection
                        WorkspaceView.currentItem.attribute = "contents"
                        WorkspaceView.setEditorContents(startupFileContents)
                    })
                })
            } else {
                startEditor(() => {
                    initialKeyToGoTo = WorkspaceView.fetchStoredItemId()
                    if (WorkspaceView.journalChoice !== "server") WorkspaceView.goToKey(initialKeyToGoTo)
                },() => {
                    WorkspaceView.restoreJournalChoice()
                })
            }
        })
    }
    
    startup()
})
