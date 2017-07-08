// Mithril component which embeds an iframe with a PDF document of an quantum vacuum energy patent

const MyComponent = {
    view() {
        return m("div.ba.ma3.pa3.bg-light-purple",
            m("iframe", {src: "//ecee.colorado.edu/~moddel/QEL/Papers/US7379286.pdf", width: 800, height: 600})
        )
    }
}

Twirlip7.show(MyComponent)
