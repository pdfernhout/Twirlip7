requirejs(["vendor/mithril", "ui"], function(mDiscardAsMadeGlobal, Archive) {
    "use strict"
    
    const root = document.body
    m.mount(root, Archive)
})