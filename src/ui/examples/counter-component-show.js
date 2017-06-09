// Use the "Twirlip7.show(...)" convenience function to display a component too.
// Here is our first troublesome non-closing component wrapped up in a closable view

var state = {
    count: 0,
    inc: function() {state.count++}
}

var Counter = {
    view: function() {
        return m("div", {onclick: state.inc}, state.count)
    }
}

Twirlip7.show(Counter, ".bg-blue.br4")
