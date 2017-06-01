// Mithril component which embeds an iframe with HTML
// Doug Engelbart Unfinished Revolution II Colloquium -- UnRev-II - headers sorted By Date

let div = document.createElement("div")
 
const MyComponent = {
    view(controller, args) {
        return m("div.ba.ma3.pa3.bg-light-purple",
            m("button.fr", {onclick: function () { m.mount(div, null); document.body.removeChild(div) } }, "X"),
            m("iframe", {src: "//dougengelbart.org/colloquium/forum/discussion/date.html", width: 800, height: 600})
        )
    }
}

document.body.appendChild(div)
m.mount(div, MyComponent)
