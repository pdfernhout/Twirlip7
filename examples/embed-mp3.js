// Mithril component which embeds mp3 file Journey composed by Isiah Meadows
// Source: https://www.isiahmeadows.com/music/journey.html

const MyComponent = {
    view(controller, args) {
        return m("div.ba.ma3.pa3.bg-light-purple", [
            m(".pa2",
                m("a", { href: "//www.isiahmeadows.com/music/journey.html", target: "_blank" }, "Journey -- by Isiah Meadows")
            ),
            m("embed", { src: "//drive.google.com/uc?id=0B02h60r9WvJrcmREV0dGYmlCdVE", width: 400, height: 100, autostart: false }),
            m("blockquote.i", "\"Use what talents you possess; the woods would be very silent if no birds sang there except those that sang best.\" (Henry Van Dyke)")
        ])
    }
}

Twirlip7.show(MyComponent)
