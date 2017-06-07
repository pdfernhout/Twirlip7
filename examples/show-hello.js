// Use the "Twirlip7.show(...)" convenience function to display a view 
// made by a function that returns Mithril vdom nodes made using "m".

// You can add extra Tachyons.js styling for the enclosing div as an optional second parameter.

Twirlip7.show(() => {
    return m("button.bg-red.pa2.br4", { onclick: () => alert("Hello world") }, "Hello")
}, ".bg-blue.br4")
