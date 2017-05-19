requirejs.config({
    paths: { ace: ["vendor/ace"] }
})

requirejs(["vendor/mithril", "WorkspaceView", "JournalUsingLocalStorage"], function(mDiscardAsMadeGlobal, WorkspaceView, JournalUsingLocalStorage) {
    "use strict"
    
    /* global location */
    
    const hash = location.hash
    
    if (hash && hash.startsWith("#open=")) {
        const itemIndex = hash.substring(6)
        const item = JournalUsingLocalStorage.getItem(itemIndex)
        if (item) {
            eval(item)
        }
    } else {
        const root = document.body
        // WorkspaceView could be null if hash is 
        m.mount(root, WorkspaceView)
    }
})
