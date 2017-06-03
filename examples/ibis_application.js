// IBIS application

// This is an unfinished work in progress

// References:
// arrow marker: https://stackoverflow.com/questions/12680166/how-to-use-an-arrow-marker-on-an-svg-line-element
// arrowhead derived from: https://stackoverflow.com/questions/11808860/how-to-place-arrow-head-triangles-on-svg-lines
// marker-end: http://tutorials.jenkov.com/svg/marker-element.html
// line to edge of circle: https://stackoverflow.com/questions/13165913/draw-an-arrow-between-two-circles#13234898

/* global CompendiumIcons */

// You need to have run the snippet which defines the CompendiumIcons global with the IBIS icons first
// This next section does that for you if needed
if (!window.CompendiumIcons) {
    const iconLoaderResource = {
        name: "Compendium Icons Loader",
        id: "28746681f0477c2d66e09e3c4fc3c73ede3dcb3d5f972aaa3d281e09d8d01270"
    }
    
    const iconLoader = Twirlip7.getCurrentJournal().getItem(iconLoaderResource.id)
    if (iconLoader) {
        /* eslint no-eval: 0 */
        /* jslint evil: true */
        eval(iconLoader)
    }
}

const diagram = []

// tiny stack for connecting items
let firstDraggedItem = null
let secondDraggedItem = null

let draggedItem = null
let dragStart = {x: 0, y: 0}
let objectStart = {x: 0, y: 0}

let mouseTrackingPosition = {x: 0, y: 0}
let lastClickPosition = null

function onmousedownBackground(event) {
    if (draggedItem) return
    console.log("onmousedownBackground")
    const rect = event.target.getBoundingClientRect();
    lastClickPosition = { x: event.clientX - rect.left, y: event.clientY - rect.top }
}

function onmousedown(element, event) {
    console.log("onmousedown")
    lastClickPosition = null
    firstDraggedItem = secondDraggedItem
    secondDraggedItem = element
    draggedItem = element
    dragStart = { x: event.clientX, y: event.clientY }
    objectStart = { x: element.x, y: element.y }
}

function onmousemove(event) {
    console.log("mouse move")
    if (draggedItem) {
        const dx = event.clientX - dragStart.x
        const dy = event.clientY - dragStart.y
        const newX = objectStart.x + dx
        const newY = objectStart.y + dy
        draggedItem.x = newX
        draggedItem.y = newY
    } else {
        mouseTrackingPosition = {x: event.clientX, y: event.clientY }
    }
}

function onmouseup() {
    console.log("mouse up")
    draggedItem = null
}

function onkeydown(event) {
    console.log("onkeydown", event)
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
    const x = lastClickPosition ? lastClickPosition.x : newX()
    const y = lastClickPosition ? lastClickPosition.y : newY()
    diagram.unshift({ type: type, name: name, x: x, y: y })
    if (lastClickPosition) {
        lastClickPosition.x += 37;
        lastClickPosition.y += 23;
    }
}

function addLink() {
    if (!firstDraggedItem) return
    if (!secondDraggedItem) return
    firstDraggedItem.parent = secondDraggedItem
}

// Need to add undo

function deleteLink() {
    if (!secondDraggedItem) return
    secondDraggedItem.parent = undefined
}

function deleteElement() {
    if (!secondDraggedItem) return
    const index = diagram.indexOf(secondDraggedItem)
    if (index > -1) {
        diagram.splice(index, 1)
    }
}

function viewLink(element) {
    const parent = element.parent
    if (!parent) return
    
    const xA = parent.x
    const yA = parent.y
    const xB = element.x
    const yB = element.y
    const radius = 24
    
    const d = Math.sqrt((xB - xA) * (xB - xA) + (yB - yA) * (yB - yA))
    const d2 = d - radius
    
    const ratio = d2 / d
    
    const dx = (xB - xA) * ratio
    const dy = (yB - yA) * ratio
    
    const x = xA + dx
    const y = yA + dy

    return m("line", {
        x1: x,
        y1: y,
        x2: element.x - dx,
        y2: element.y - dy,
        "marker-end": "url(#arrowhead)",
        stroke: "black", 
        "stroke-width": 1
    })
}

function viewElement(element) {
    return [
        m("image", {
            "xlink:href": CompendiumIcons[element.type + "_png"],
            x: element.x - 16,
            y: element.y - 16,
            width: 32,
            height: 32,
            alt: "question",
            onmousedown: (event) => onmousedown(element, event)
        }),
        m("text", {x: element.x, y: element.y + 34, "text-anchor": "middle"}, element.name)
    ]
}

function viewArrowhead() {
    return m("marker", {
        id: "arrowhead",
        orient: "auto",
        markerWidth: 8,
        markerHeight: 16,
        refX: 2,
        refY: 4,
    }, m("path", { d: "M0,0 V8 L8,4 Z", fill: "black" }))
}

Twirlip7.show(() => {
    return [
        m("button.ma1", { onclick: addElement.bind(null, "issue") }, "Add question"),
        m("button.ma1", { onclick: addElement.bind(null, "position") }, "Add position"),
        m("button.ma1", { onclick: addElement.bind(null, "plus") }, "Add plus"),
        m("button.ma1", { onclick: addElement.bind(null, "minus") }, "Add minus"),
        m("button.ma1", { onclick: addLink }, "Link last two"),
        m("button.ma1", { onclick: deleteLink }, "Delete link"),
        m("button.ma1", { onclick: deleteElement }, "Delete element"),
        m("br"),
        // on keydown does not seem to work here
        m("svg.diagram.ba", { width: 600, height: 300, onmousedown: onmousedownBackground, onmousemove: onmousemove, onmouseup: onmouseup, onkeydown: onkeydown },
            viewArrowhead(),
            diagram.map((element) => {
                return viewLink(element)
            }),
            diagram.map((element) => {
                return viewElement(element)
            })
        )
    ]
}, ".bg-blue.br4")
