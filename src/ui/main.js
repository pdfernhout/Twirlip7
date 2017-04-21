requirejs(["vendor/mithril", "WorkspaceView"], function(mDiscardAsMadeGlobal, WorkspaceView) {
    "use strict"
    
    const root = document.body
    m.mount(root, WorkspaceView)
})