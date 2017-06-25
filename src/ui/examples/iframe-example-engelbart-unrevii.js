// Mithril component which embeds an iframe with HTML
// Doug Engelbart Unfinished Revolution II Colloquium -- UnRev-II - headers sorted By Date
// This also demostrates supplying a title to display instead of "Untitled" when the component is collapsed

const MyComponent = {
    view(controller, args) {
        return m("div.ba.ma3.pa3.bg-light-purple",
            m("iframe", {src: "//dougengelbart.org/colloquium/forum/discussion/date.html", width: 800, height: 600})
        )
    }
}

Twirlip7.show(MyComponent, { extraStyling: ".bg-light-purple", title: "Doug Engelbart Unfinished Revolution II Colloquium" })
