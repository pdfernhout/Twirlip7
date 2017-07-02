// Example of using Font Awesome Icons included with the Twirlip7 application
// Click on the "Font Awesome" link in the help header to lookup names for icons.

const someIcons = ["fa-glass", "fa-music", "fa-search", "fa-envelope-o", "fa-heart", "fa-star", "fa-star-o", "fa-user", "fa-film", "fa-th-large", "fa-th", "fa-th-list", "fa-check", "fa-times", "fa-search-plus", "fa-search-minus", "fa-power-off", "fa-signal", "fa-cog", "fa-trash-o", "fa-home", "fa-file-o"]

Twirlip7.show(() => {
    return m("div", [
        // Using an icon directly and with a Twirlip7 convenience function
        m("i.fa.fa-fast-forward[aria-hidden=true]"),
        m("br"),
        Twirlip7.icon("fa-fast-forward"),
        
        m("br"),
        
        // Using an icon in a button -- including with an extra Tachyons css class for styling the left margin
        m("button", "Last", m("i.fa.fa-fast-forward[aria-hidden=true].ml1")),
        m("br"),
        m("button", "Last", Twirlip7.icon("fa-fast-forward.ml1")),
        
        m("br"),
        
        // Display a bunch of icons
        someIcons.map((iconName) => {
            // Extra styling can also be applied as a second paraamter to the icon function
            return Twirlip7.icon(iconName, ".ml2")
        })
    ])
})
