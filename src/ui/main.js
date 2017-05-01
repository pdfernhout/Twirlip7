requirejs.config({
    paths: { ace: ["vendor/ace"] }
})

requirejs(["vendor/mithril", "WorkspaceView", "JournalUsingLocalStorage"], function(mDiscardAsMadeGlobal, WorkspaceView, JournalUsingLocalStorage) {
    "use strict"
    
    /* global location */
    
    const hash = location.hash;
    console.log("hash", hash);
    
    if (hash && hash.startsWith("#show=")) {
        const itemIndex = hash.substring(6);
        console.log("has hash itemIndex", itemIndex)
        const item = JournalUsingLocalStorage.getItem(parseInt(itemIndex) - 1)
        console.log("item", item)
        if (item) {
            eval(item)
        }
    } else {
        const root = document.body
        // WorkspaceView could be null if hash is 
        m.mount(root, WorkspaceView)
    }
})