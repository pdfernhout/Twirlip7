// You can modify the HTML displayed on this page using Mithril.js.
// Click on "Do it" to run this example.
// Click on the counter (the "0" at the bottom of the page) to increment it.

// You can click "Do it" again to get more counters.

// You will have to reload the editor to remove this widget.
// Or, you can also remove it using the inspector to delete it in the JavaScript console.,
// but that will leave some internal Mithral references around.

// The next example will improve on this one to have a close box.

// Remember to reload before moving on to the next page to get rid of the counter.
// Your position in these tutorial snippets will be saved automatically and restored after a reload.

var state = {
    count: 0,
    inc: function() {state.count++}
}

var Counter = {
    view: function() {
        return m("div", {onclick: state.inc}, state.count)
    }
}

var div = document.createElement("div")
document.body.appendChild(div)
m.mount(div, Counter)
