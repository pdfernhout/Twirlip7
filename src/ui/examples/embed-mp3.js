// Mithril component which embeds mp3 file Journey composed by Isiah Meadows (one of the contributors to Mithril.js)
// Source: https://www.isiahmeadows.com/music/journey.html

const MyComponent = {
    view(controller, args) {
        return m("div.ba.ma3.pa3.bg-light-purple", [
            m(".pa2",
                m("a", { href: "//www.isiahmeadows.com/music/journey.html", target: "_blank" }, "Journey -- by Isiah Meadows")
            ),
            m("embed", { src: "//drive.google.com/uc?id=0B02h60r9WvJrcmREV0dGYmlCdVE", width: 400, height: 100, autostart: false }),
            m("blockquote.i", "\"Use what talents you possess; the woods would be very silent if no birds sang there except those that sang best.\" (Henry Van Dyke)"),
            m("blockquote.i", m("a", {href: "http://www.mindsetonline.com/whatisit/about/index.html"}, "Mindset"), ` is a simple idea discovered by world-renowned Stanford University psychologist Carol Dweck in decades of research on achievement and success—a simple idea that makes all the difference.
In a fixed mindset, people believe their basic qualities, like their intelligence or talent, are simply fixed traits. They spend their time documenting their intelligence or talent instead of developing them. They also believe that talent alone creates success—without effort. They’re wrong.
In a growth mindset, people believe that their most basic abilities can be developed through dedication and hard work—brains and talent are just the starting point. This view creates a love of learning and a resilience that is essential for great accomplishment. Virtually all great people have had these qualities.`)
        ])
    }
}

Twirlip7.show(MyComponent)
