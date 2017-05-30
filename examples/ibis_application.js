// IBIS application

// You need to have run the snippet which defines the CompendiumIcons global with the IBIS icons first

/* global CompendiumIcons */

Twirlip7.show(() => {
    return Object.keys(CompendiumIcons).map((key) => {
        return m("img.ma1", {src: CompendiumIcons[key], alt: key.substring(0, key.length - 4) + " icon"})
    })
}, ".bg-blue.br4")
