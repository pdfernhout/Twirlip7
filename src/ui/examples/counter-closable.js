// This is a modified version of the previous example with a close box (the "X").
// When the counter is closed, Mithril is told to unmount it which cleans up internal references.

// You can learn more about Mithril by clicking on the Mithril.js link near the top of this page.
// The "Mithril" part of the link goes to the main website; the ".js" part goes to the source code.

var div = document.createElement("div")

var state = {
    count: 0,
    inc: function() {state.count++}
}

var Counter = {
    view: function() {
        return m("div",
            m("button", {onclick: function () { m.mount(div, null); document.body.removeChild(div) } }, "X"),
            m("div", {onclick: state.inc}, state.count)
        )
    }
}

document.body.appendChild(div)
m.mount(div, Counter)
