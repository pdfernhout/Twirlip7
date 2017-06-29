// Mithril component which embeds four iframes with HTML videos

const MyComponent = {
    view(controller, args) {
        return m("div.ba.ma3.pa3.bg-light-purple", [
            // The Mother of All Demos, presented by Douglas Engelbart (1968)
            m("iframe", {src: "//www.youtube.com/embed/yJDv-zdhzMY", width: 800, height: 600, frameborder: "0", allowfullscreen: true}),
            
            // Alan Kay at OOPSLA 1997 - The computer revolution hasn't happened yet
            m("iframe", {src: "//www.youtube.com/embed/oKg1hTOQXoY", width: 800, height: 600, frameborder: "0", allowfullscreen: true}),
            
            // The Lively Kernel presented by Dan Ingalls aa a Google Tech Talks  (2008)
            m("iframe", {src: "//www.youtube.com/embed/gGw09RZjQf8", width: 800, height: 600, frameborder: "0", allowfullscreen: true}),
            
            // Twirlip Civic Sensemaking Project Overview (2011)
            m("iframe", {src: "//www.youtube.com/embed/_mRy4sGK7xk", width: 800, height: 600, frameborder: "0", allowfullscreen: true}),
        ])
    }
}

Twirlip7.show(MyComponent, { title: "Videos on the future, the present, and the past" } )
