// You will have to reload the editor or use the inspector to remove this widget
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
