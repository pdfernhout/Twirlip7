// IBIS application

// You need to have run the snippet which defines the CompendiumIcons global with the IBIS icons first
// item: 28746681f0477c2d66e09e3c4fc3c73ede3dcb3d5f972aaa3d281e09d8d01270

// This is an unfinished work in progress

/* global CompendiumIcons */

const diagram = []

let draggedItem = null
let dragStart = {}
let objectStart = {}

function onmousedown(element, event) {
    draggedItem = element
    dragStart = { x: event.clientX, y: event.clientY }
    objectStart = { x: element.x, y: element.y }
}

function onmousemove(event) {
    if (draggedItem) {
        const dx = event.clientX - dragStart.x
        const dy = event.clientY - dragStart.y
        const newX = objectStart.x + dx
        const newY = objectStart.y + dy
        draggedItem.x = newX
        draggedItem.y = newY
    }
}

function onmouseup() {
    draggedItem = null
}

function newX() {
    return (20 + (diagram.length * 37)) % 600
}

function newY() {
    return (50 + (diagram.length * 23)) % 300
}

function addElement(type) {
    const name = prompt(type + " name")
    if (!name) return
    diagram.unshift({ type: type, name: name, x: newX(), y: newY() } )
}

function viewElement(element) {
    return [
        m("image", {
            "xlink:href": CompendiumIcons[element.type + "_png"],
            x: element.x,
            y: element.y,
            width: 32,
            height: 32,
            alt: "question",
            onmousedown: (event) => onmousedown(element, event)
        }),
        m("text", {x: element.x + 16, y: element.y + 50, "text-anchor": "middle"}, element.name)
    ]
}

Twirlip7.show(() => {
    return [
        m("button.ma1", { onclick: addElement.bind(null, "issue") }, "Add question"),
        m("button.ma1", { onclick: addElement.bind(null, "position") }, "Add position"),
        m("button.ma1", { onclick: addElement.bind(null, "plus") }, "Add plus"),
        m("button.ma1", { onclick: addElement.bind(null, "minus") }, "Add minus"),
        m("br"),
        m("svg.diagram.ba", { width: 600, height: 300, onmousemove: onmousemove, onmouseup: onmouseup, },
            diagram.map((element) => {
                return viewElement(element)
            })
        )
    ]
}, ".bg-blue.br4")
