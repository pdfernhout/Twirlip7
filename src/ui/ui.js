requirejs(["vendor/mithril"], function(mIgnore) {
    const root = document.body

    const Archive = {
        items: [],
        add: function() { Archive.items.push(Archive.editorContents); Archive.editorContents = "" },
        editorContents: "",
        view: function() {
            return m("main", [
                m("h1", {class: "title bw24 b--solid b--blue"}, "Item count " + Archive.items.length),
                m("textarea", { value: Archive.editorContents,  onchange: function (event) { Archive.editorContents = event.target.value } }),
                m("br"),
                m("button", { onclick: Archive.add }, "Add"),
                m("button", { onclick: function () { console.log("items", Archive.items) }}, "Log"),
            ])
        }
    }

    m.mount(root, Archive)
})