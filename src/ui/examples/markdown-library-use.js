// Example of using markdown library included in base distribution

requirejs(["vendor/marked"], function(marked) {

    const markdownString = `
Examples of using __markdown__.

\`console.log("hello");\`

### Quote

> "The biggest challenge of the 21st century is the irony of technologies of abundance in the hands of those still thinking in terms of scarcity."<br>(Paul D. Fernhout)

### HTML

Hello <b>bold</b> world
`

    Twirlip7.show(() => {
        return m("div", m.trust(marked.marked(markdownString)))
    }, ".bg-green.br4")
})
