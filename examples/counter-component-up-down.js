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
      "Hello world!",
      m("br"),
      "counter: " + counter,
      m("button", {onclick: testButtonClicked.bind(null, -1)}, "-"),
      m("button", {onclick: testButtonClicked.bind(null, 1)}, "+")
    )
  }
}

document.body.appendChild(div)
m.mount(div, MyComponent)
