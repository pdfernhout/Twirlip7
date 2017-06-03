// IBIS application

// This is an unfinished work in progress

/**************************************
# Conceptual references

Dialogue Mapping: Building Shared Understanding of Wicked Problems 
by Jeff Conklin
https://www.amazon.com/Dialogue-Mapping-Building-Understanding-Problems/dp/0470017686

The book explains how we can visualize discussions on complex topics using the IBIS notation (Questions/Issues, Ideas, Reasons/Pros&Cons) 
which provides just enough structure to aid a group's short-term memory without getting in the way.
What might be arguments over the best way to proceed become collaborations 
in constructing a dialogue map exploring all the possibilities and their evaluations.

More on Dialog Mapping can be found at Jeff Conklin's website here:
http://cognexus.org/id41.htm

Compendium desktop software for IBIS:
http://compendium.open.ac.uk/

Constructing Knowledge Art: An Experiential Perspective on Crafting Participatory Representations
by Al Selvin and Simon Buckingham Shum (who created the Compendium software)
https://www.amazon.com/gp/product/1627052593

This is a broader exploration of dialog mapping and similar participatory technologies from an advanced facilitator's perspective.]
Most people would probably want to read Jeff Conklin's "how to" book on Dialogue Mapping first,
and then move onto this one once they are ready to grow further as a facilitator of group work.

# Programming references

arrow marker: https://stackoverflow.com/questions/12680166/how-to-use-an-arrow-marker-on-an-svg-line-element
arrowhead derived from: https://stackoverflow.com/questions/11808860/how-to-place-arrow-head-triangles-on-svg-lines
marker-end: http://tutorials.jenkov.com/svg/marker-element.html
line to edge of circle: https://stackoverflow.com/questions/13165913/draw-an-arrow-between-two-circles#13234898

Example JSON data to paste in to "Diagram JSON" textarea and load using "Update Diagram from JSON" button

[
    {
        "type": "minus",
        "name": "minus",
        "x": 368,
        "y": 173,
        "notes": "",
        "id": "5de7524c-ba07-4571-9282-9ec2d352f15c",
        "parentId": "1822527c-b6c4-4f86-8a5d-3b9323e9c8db"
    },
    {
        "type": "plus",
        "name": "plus",
        "x": 366,
        "y": 50,
        "notes": "some notes on plus",
        "id": "4cb3b633-dfd5-428c-8fce-26c4bcbe27d3",
        "parentId": "1822527c-b6c4-4f86-8a5d-3b9323e9c8db"
    },
    {
        "type": "position",
        "name": "p1",
        "x": 215,
        "y": 106,
        "notes": "",
        "id": "1822527c-b6c4-4f86-8a5d-3b9323e9c8db",
        "parentId": "5e7b7953-4efe-4f8c-b8c4-56cc3499087b"
    },
    {
        "type": "issue",
        "name": "q1",
        "x": 100,
        "y": 100,
        "notes": "",
        "id": "5e7b7953-4efe-4f8c-b8c4-56cc3499087b"
    }
]

**************************************/

/* global CompendiumIcons */

// You need to have run the snippet which defines the CompendiumIcons global with the IBIS icons first
// This next section does that for you if you are using a local storage journal with the examples loaded
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

let diagram = []
let diagramJSON = JSON.stringify(diagram, null, 4)
    
// tiny stack for connecting items
let earlierDraggedItem = null
let laterDraggedItem = null

let draggedItem = null
let dragStart = {x: 0, y: 0}
let objectStart = {x: 0, y: 0}

let lastClickPosition = {x: 50, y: 50}

function onmousedownBackground(event) {
    event.preventDefault()
    if (draggedItem) return
    // TODO: Rubber band selection
}

function onmousedown(element, event) {
    event.preventDefault()
    earlierDraggedItem = laterDraggedItem
    laterDraggedItem = element
    draggedItem = element
    dragStart = { x: event.clientX, y: event.clientY }
    objectStart = { x: element.x, y: element.y }
}

function onmousemoveBackground(event) {
    event.preventDefault()
    if (draggedItem) {
        const dx = event.clientX - dragStart.x
        const dy = event.clientY - dragStart.y
        const newX = objectStart.x + dx
        const newY = objectStart.y + dy
        draggedItem.x = newX
        draggedItem.y = newY
    }
}

function onmouseupBackground(event) {
    event.preventDefault()
    const rect = event.target.getBoundingClientRect()
    if (draggedItem) {
        lastClickPosition = { x: draggedItem.x, y: draggedItem.y }
        updateDiagramJSON()
    } else {
        lastClickPosition = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }
    draggedItem = null
}

function onkeydown(event) {
    console.log("onkeydown", event)
}

function uuid() {
    // From: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript#2117523
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8)
        return v.toString(16)
    })
}

function addElement(type) {
    const name = prompt(type + " name")
    if (!name) return
    const x = lastClickPosition.x + 50
    const y = lastClickPosition.y + 50
    const element = { type: type, name: name, x: x, y: y, notes: "", id: uuid() }
    diagram.unshift(element)
    if (lastClickPosition) {
        lastClickPosition.x += 50
        lastClickPosition.y += 50
    }
    earlierDraggedItem = laterDraggedItem
    laterDraggedItem = element
    updateDiagramJSON()
}

function addLink() {
    if (!earlierDraggedItem) return
    if (!laterDraggedItem) return
    laterDraggedItem.parentId = earlierDraggedItem.id
    updateDiagramJSON()
}

// Need to add undo

function deleteLink() {
    if (!laterDraggedItem) return
    laterDraggedItem.parentId = undefined
    updateDiagramJSON()
}

function deleteElement() {
    if (!laterDraggedItem) return
    const index = diagram.indexOf(laterDraggedItem)
    if (index > -1) {
        diagram.splice(index, 1)
    }
    updateDiagramJSON()
}

function viewLink(element) {
    const parentId = element.parentId
    if (!parentId) return []
    const parent = diagram.find(element => element.id === parentId)
    if (!parent) return []
    
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
            onmousedown: (event) => onmousedown(element, event),
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

function updateDiagramJSON() {
    diagramJSON = JSON.stringify(diagram, null, 4)
}

function viewItemPanel() {
    const element = laterDraggedItem
    const disabled = !element
    
    function updateDiagramFromJSON() {
        if (!confirm("Update diagram from JSON?")) return
        const newDiagram = JSON.parse(diagramJSON)
        diagram = newDiagram
    }

    return m("div.fl.ma1", {style: "flex-grow: 100"}, [
        "Item name",
        m("br"),
        m("input.w-100", {value: element ? element.name : "", oninput: (event) => { element.name = event.target.value; updateDiagramJSON() }, disabled}),
        m("br.ma2"),
        "Notes:",
        m("br"),
        m("textarea.w-100", {value: element ? element.notes : "", oninput: (event) => { element.notes = event.target.value; updateDiagramJSON() }, disabled}),
        m("br.ma2"),
        "Diagram JSON:",
        m("br"),
        m("textarea.w-100", {value: diagramJSON, oninput: (event) => diagramJSON = event.target.value}),
        m("button", { onclick: updateDiagramFromJSON }, "Update Diagram from JSON"),
    ])
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
        m("div.flex", [
            // on keydown does not seem to work here
            m("svg.diagram.ba.fl", { 
                width: 600, 
                height: 300, 
                onmousedown: onmousedownBackground, 
                onmousemove: onmousemoveBackground, 
                onmouseup: onmouseupBackground, 
                onkeydown: onkeydown
            }, [
                viewArrowhead(),
                diagram.map(element => viewLink(element)),
                diagram.map(element => viewElement(element)),
            ]),
            viewItemPanel(),
        ]),
        m("div.cl")
    ]
}, ".bg-blue.br4")
