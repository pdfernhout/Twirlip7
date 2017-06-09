// Mithril component which embeds four iframes with HTML videos

const MyComponent = {
    view(controller, args) {
        return m("div.ba.ma3.pa3.bg-light-purple", [
            // Passengers 2016 - Starship Avalon Slingshot Around The Red Giant Star Arcturus
            m("iframe", {src: "//www.youtube.com/embed/1jGRpuzrkpk", width: 800, height: 600, frameborder: "0", allowfullscreen: true}),
            // Alan Kay at OOPSLA 1997 - The computer revolution hasn't happened yet
            m("iframe", {src: "//www.youtube.com/embed/oKg1hTOQXoY", width: 800, height: 600, frameborder: "0", allowfullscreen: true}),
            // The Mother of All Demos, presented by Douglas Engelbart (1968)
            m("iframe", {src: "//www.youtube.com/embed/yJDv-zdhzMY", width: 800, height: 600, frameborder: "0", allowfullscreen: true}),
            // Twirlip Civic Sensemaking Project Overview 
            m("iframe", {src: "//www.youtube.com/embed/_mRy4sGK7xk", width: 800, height: 600, frameborder: "0", allowfullscreen: true}),
        ])
    }
}

Twirlip7.show(MyComponent)
