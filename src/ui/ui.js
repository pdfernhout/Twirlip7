requirejs(["vendor/mithril"], function(mIgnore) {
    const root = document.body

    const Archive = {
        editorContents: "",
        lastLoadedContents: "",
        items: [],
        previousNextIndex: 0,

        setEditorContents(newContents) {
            Archive.editorContents = newContents
            Archive.lastLoadedContents = newContents
        },

        add: function() {
            Archive.items.push(Archive.editorContents)
            Archive.setEditorContents("")
        },

        confirmClear: function(promptText) {
            if (!Archive.editorContents) return true
            if (Archive.editorContents === Archive.lastLoadedContents) return true;
            if (!promptText) promptText = "You have unsaved editor changes; proceed?"
            return confirm(promptText)
        },

        clear: function() {
            if (!Archive.confirmClear()) return
            Archive.setEditorContents("")
        },

        eval: function () {
            Archive.setEditorContents(Archive.editorContents + "\n" + eval(Archive.editorContents))
        },

        skip: function (offset) {
            if (!Archive.items.length) return
            Archive.previousNextIndex = (Archive.items.length + Archive.previousNextIndex + offset) % Archive.items.length
            console.log("Archive.previousNextIndex", Archive.previousNextIndex)
            Archive.setEditorContents(Archive.items[Archive.previousNextIndex])
        },

        previous: function () { Archive.skip(-1) },

        next: function () { Archive.skip(1) },

        textForLog: function() {
            return JSON.stringify(Archive.items, null, 4)
        },

        showLog: function () {
            console.log("items", Archive.items)
            if (!Archive.confirmClear()) return
            Archive.setEditorContents(Archive.textForLog()) 
        },

        loadLog: function () {
            if (!confirm("Replace all items with entered text for a log?")) return
            Archive.items = JSON.parse(Archive.editorContents)
            // Update in case pasted contents
            Archive.lastLoadedContents = Archive.editorContents
        },

        view: function() {
            return m("main.ma2", [
                m("h1.title.bw24.b--solid.b--blue", "Item count " + Archive.items.length),
                m("textarea", { value: Archive.editorContents, onchange: function (event) { Archive.editorContents = event.target.value } }),
                m("br"),
                m("button.ma1", { onclick: Archive.add }, "Add"),
                m("button.ma1", { onclick: Archive.clear }, "Clear"),
                m("button.ma1", { onclick: Archive.eval }, "Eval"),
                m("br"),
                m("button.ma1", { onclick: Archive.previous }, "Previous"),
                m("button.ma1", { onclick: Archive.next }, "Next"),
                m("br"),
                m("button.ma1", { onclick: Archive.showLog }, "Show log"),
                m("button.ma1", { onclick: Archive.loadLog }, "Load log")
            ])
        }
    }

    m.mount(root, Archive)
})