var div = document.createElement("div")

var state = {
    count: 0,
    inc: function() {state.count++}
}

var Counter = {
    view: function() {
        return m("div.ba.ma3.pa3.bg-light-purple",
            m("button.fr", {onclick: function () { m.mount(div, null); document.body.removeChild(div) } }, "X"),
            m("div", {onclick: state.inc}, state.count)
        )
    }
}

document.body.appendChild(div)
m.mount(div, Counter)
