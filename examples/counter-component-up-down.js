// This example creates a counter component in Mithril.

let div = document.createElement("div")
 
let counter = 0

function testButtonClicked(increment) {
    console.log("testButtonClicked")
    counter += increment
}

const MyComponent = {
    view(controller, args) {
        return m("div.ba.ma3.pa3.bg-light-purple",
            m("button.fr", {onclick: function () { m.mount(div, null); document.body.removeChild(div) } }, "X"),
            "Hello from a counter component!",
            m("br"),
            m("span.f3.ma1", "counter: " + counter),
            m("button.ma1", {onclick: testButtonClicked.bind(null, -1)}, "-"),
            m("button.ma1", {onclick: testButtonClicked.bind(null, 1)}, "+")
        )
    }
}

document.body.appendChild(div)
m.mount(div, MyComponent)
