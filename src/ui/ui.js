requirejs(["vendor/mithril"], function(mIgnore) {
    const root = document.body

    const Hello = {
        count: 0,
        increment: function() { Hello.count++ },
        view: function() {
            return m("main", [
                m("h1", {class: "title bw24 b--solid b--blue"}, "Click count " + Hello.count),
                m("button", { onclick: Hello.increment }, "Increment"),
            ])
        }
    }

    m.mount(root, Hello)
})