requirejs(["vendor/mithril"], function(mIgnore) {
    const root = document.body

    const Archive = {
        items: [],
        add: function() { Archive.items.push(Archive.editorContents); Archive.editorContents = "" },
        confirmClear: function(promptText) {
            if (!Archive.editorContents) return true
            if (Archive.editorContents === Archive.textForLog()) return true;
            if (!promptText) promptText = "You have unsaved editor changes; proceed?"
            return confirm(promptText)
        },
        clear: function() { if (!Archive.confirmClear()) return; Archive.editorContents = "" },
        textForLog: function() { return JSON.stringify(Archive.items, null, 4) },
        showLog: function () {
            console.log("items", Archive.items)
            if (!Archive.confirmClear()) return
            Archive.editorContents = Archive.textForLog(); 
        },
        eval: function () {
            Archive.editorContents = eval(Archive.editorContents) 
        },
        editorContents: "",
        view: function() {
            return m("main.ma2", [
                m("h1.title.bw24.b--solid.b--blue", "Item count " + Archive.items.length),
                m("textarea", { value: Archive.editorContents, onchange: function (event) { Archive.editorContents = event.target.value } }),
                m("br"),
                m("button.ma1", { onclick: Archive.add }, "Add"),
                m("button.ma1", { onclick: Archive.showLog }, "Show log"),
                m("button.ma1", { onclick: Archive.clear }, "Clear"),
                m("button.ma1", { onclick: Archive.eval }, "Eval"),
            ])
        }
    }

    m.mount(root, Archive)
})