let div = document.createElement("div")
 
const MyComponent = {
    view(controller, args) {
        return m("div.ba.ma3.pa3.bg-light-purple",
            m("button.fr", {onclick: function () { m.mount(div, null); document.body.removeChild(div) } }, "X"),
            m("iframe", {src: "//ecee.colorado.edu/~moddel/QEL/Papers/US7379286.pdf", width: 800, height: 600})
        )
    }
}

document.body.appendChild(div)
m.mount(div, MyComponent)
