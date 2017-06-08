// IBIS application

// This is an unfinished work in progress

/**************************************
# Conceptual references

Dialogue Mapping: Building Shared Understanding of Wicked Problems 
by Jeff Conklin
https://www.amazon.com/Dialogue-Mapping-Building-Understanding-Problems/dp/0470017686

The book explains how we can visualize discussions on complex topics
using the IBIS notation (Questions/Issues, Ideas, Reasons/Pros&Cons) 
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

This is a broader exploration of dialog mapping and similar participatory technologies 
from an advanced facilitator's perspective.
Most people would probably want to read Jeff Conklin's "how to" book on Dialogue Mapping first,
and then move onto this one once they are ready to grow further as a facilitator of group work.

# Programming references

arrow marker:
https://stackoverflow.com/questions/12680166/how-to-use-an-arrow-marker-on-an-svg-line-element
arrowhead derived from:
https://stackoverflow.com/questions/11808860/how-to-place-arrow-head-triangles-on-svg-lines
marker-end:
http://tutorials.jenkov.com/svg/marker-element.html
line to edge of circle:
https://stackoverflow.com/questions/13165913/draw-an-arrow-between-two-circles#13234898

Below is some example JSON data to paste into "Edit Diagram JSON" textarea.
After pasting, load it using "Update Diagram from JSON" button.

{
    "width": 800,
    "height": 500,
    "diagramName": "Example IBIS Map",
    "elements": [
        {
            "type": "plus",
            "name": "plus2",
            "x": 420,
            "y": 352,
            "notes": "",
            "id": "ff5f9114-88a4-4860-9a13-77591457156b",
            "parentId": "5ab92ff7-3cea-4598-b8e9-046319e4014f"
        },
        {
            "type": "position",
            "name": "pos2",
            "x": 267,
            "y": 337,
            "notes": "",
            "id": "5ab92ff7-3cea-4598-b8e9-046319e4014f",
            "parentId": "3f910320-1248-4e68-af2d-c4218aa82dd7"
        },
        {
            "type": "minus",
            "name": "minus",
            "x": 418,
            "y": 223.21875,
            "notes": "",
            "id": "c0a43e72-73e7-4f18-be83-9de18b3ef856",
            "parentId": "6d9561c3-edde-47b7-8ee0-57caeaed9020"
        },
        {
            "type": "plus",
            "name": "plus",
            "x": 431,
            "y": 113.21875,
            "notes": "",
            "id": "7fad1b4f-0ac8-4388-949d-e09d1daf9981",
            "parentId": "6d9561c3-edde-47b7-8ee0-57caeaed9020"
        },
        {
            "type": "position",
            "name": "pos",
            "x": 261,
            "y": 141,
            "notes": "",
            "id": "6d9561c3-edde-47b7-8ee0-57caeaed9020",
            "parentId": "3f910320-1248-4e68-af2d-c4218aa82dd7"
        },
        {
            "type": "issue",
            "name": "question",
            "x": 100,
            "y": 100,
            "notes": "",
            "id": "3f910320-1248-4e68-af2d-c4218aa82dd7"
        }
    ]
}

**************************************/

"use strict"
 
/* jshint maxerr: 100000 */
/* global CompendiumIcons, Twirlip7, m, window, prompt, confirm */

// You need to have run the snippet which defines the CompendiumIcons global with the IBIS icons first
// This next section does that for you if you are using a local storage journal with the examples loaded
if (!window.CompendiumIcons) {
    const iconLoaderResource = {
        name: "Compendium Icons Loader",
        id: "e82b2713edf72692e6546436b0e4ac1a777e8a6269b2df17459f293e8f66fbd9"
    }
    
    const iconLoaderItemJSON = Twirlip7.getCurrentJournal().getItem(iconLoaderResource.id)
    if (iconLoaderItemJSON) {
        /* eslint no-eval: 0 */
        /* jslint evil: true */
        eval(JSON.parse(iconLoaderItemJSON).value)
    }
}

let diagram = {
    width: 800,
    height: 500,
    diagramName: "Untitled IBIS Diagram",
    elements: []
}

let currentItemId = ""

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
        updateJSONFromDiagram()
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
    diagram.elements.unshift(element)
    if (lastClickPosition) {
        lastClickPosition.x += 50
        lastClickPosition.y += 50
    }
    earlierDraggedItem = laterDraggedItem
    laterDraggedItem = element
    updateJSONFromDiagram()
}

function addLink() {
    if (!earlierDraggedItem) return
    if (!laterDraggedItem) return
    if (earlierDraggedItem === laterDraggedItem) return
    laterDraggedItem.parentId = earlierDraggedItem.id
    updateJSONFromDiagram()
}

// Need to add undo

function deleteLink() {
    if (!laterDraggedItem) return
    laterDraggedItem.parentId = undefined
    updateJSONFromDiagram()
}

function deleteElement() {
    if (!laterDraggedItem) return
    const index = diagram.elements.indexOf(laterDraggedItem)
    if (index > -1) {
        diagram.elements.splice(index, 1)
    }
    updateJSONFromDiagram()
}

function viewLink(element) {
    const parentId = element.parentId
    if (!parentId) return []
    const parent = diagram.elements.find(element => element.id === parentId)
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
        element === laterDraggedItem ? 
            m("text", {x: element.x, y: element.y - 20, "text-anchor": "middle"}, "*") :
            element === earlierDraggedItem ? 
                m("text", {x: element.x, y: element.y - 20, "text-anchor": "middle"}, "<") :
                [],
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

function updateJSONFromDiagram() {
    diagramJSON = JSON.stringify(diagram, null, 4)
}

function updateDiagramFromJSON() {
    const newDiagram = JSON.parse(diagramJSON)
    diagram = newDiagram
}

let isItemPanelDisplayed = false

function viewItemPanel() {
    const element = laterDraggedItem
    const disabled = !element

    return m("div.ma1", [
        m("input[type=checkbox].ma1", {
            checked: isItemPanelDisplayed,
            onchange: event => isItemPanelDisplayed = event.target.checked
        }),
        "Edit Item",
        isItemPanelDisplayed ? [
            m("br"),
            "Type",
            m("br"),
            m("select.ma1", {onchange: event => element.type = event.target.value, disabled},
                Object.keys(CompendiumIcons).sort().map(key => {
                    // remove"_png" at end
                    const type = key.substring(0, key.length - 4)
                    return m("option", {value: type, selected: element && element.type === type}, type)
                })
            ),
            m("br"),
            "Name",
            m("br"),
            m("input.w-100", {
                value: element ? element.name : "", 
                oninput: (event) => { element.name = event.target.value; updateJSONFromDiagram() },
                disabled
            }),
            m("br.ma2"),
            "Notes",
            m("br"),
            m("textarea.w-100", {
                value: element ? element.notes : "",
                oninput: (event) => { element.notes = event.target.value; updateJSONFromDiagram() },
                disabled
            }),
        ] : []
    ])
}

let isJSONPanelDisplayed = false

function importDiagram() {
    Twirlip7.FileUtils.loadFromFile((fileName, fileContents) => {
        if (fileContents) {
            diagramJSON = fileContents
            updateDiagramFromJSON()
            if (diagram.diagramName.toLowerCase().startsWith("untitled")) {
                if (fileName.endsWith(".json")) fileName = fileName.substring(0, fileName.length - ".json".length)
                diagram.diagramName = fileName
            }
            m.redraw()
        } 
    })
}

function exportDiagram() {
    const provisionalFileName = diagram.diagramName
    Twirlip7.FileUtils.saveToFile(provisionalFileName, diagramJSON, ".json", (fileName) => {
        diagram.diagramName = fileName
        updateJSONFromDiagram()
    })
}

function saveDiagram() {
    if (diagram.diagramName.toLowerCase().startsWith("untitled")) {
        alert("Please name the diagram first by clicking on the diagram name")
        return
    }
    // Next line is extra conversion in case we missed an update somewhere
    updateJSONFromDiagram()
    const saveResult = Twirlip7.saveItem({entity: diagram.diagramName, attribute: "contents", value: diagramJSON, derivedFrom: currentItemId})
    console.log("save result", saveResult)
    currentItemId = saveResult.id
}

function loadDiagram() {
    const diagramName = prompt("Load which diagram name?", diagram.diagramName)
    if (!diagramName) return

    const items = Twirlip7.findItem({entity: diagramName, attribute: "contents"})
    if (items.length === 0) {
        console.log("item not found", diagramName)
        return
    }
    const item = items[0]
    diagramJSON = item.value
    updateDiagramFromJSON()
}

function viewJSONPanel() {
    return m("div.ma1", [
        m("button.ma1", { onclick: importDiagram }, "Import Diagram"),
        m("button.ma1", { onclick: exportDiagram }, "Export Diagram"),
        m("button.ma1", { onclick: saveDiagram }, "Save"),
        m("button.ma1", { onclick: loadDiagram }, "Load"),
        m("input[type=checkbox].ma1", {
            checked: isJSONPanelDisplayed,
            onchange: event => isJSONPanelDisplayed = event.target.checked
        }),
        m("span", "Edit Diagram as JSON"),
        isJSONPanelDisplayed ? [
            m("br"),
            m("textarea.w-100", {
                height: "20rem", value: diagramJSON,
                oninput: (event) => diagramJSON = event.target.value
            }),
            m("button", { onclick: updateDiagramFromJSON }, "Update Diagram from JSON"),
        ] : []
    ])
}

function changeDiagramName() {
    const newDiagramName = prompt("Diagram name?", diagram.diagramName)
    if (newDiagramName) diagram.diagramName = newDiagramName
}

Twirlip7.show(() => {
    return [
        "Issue Based Information System (IBIS) for Dialogue Mapping",
        " -- ",
        m("span", { onclick: changeDiagramName, title: "Click to change diagram name" }, diagram.diagramName),
        " ",
        m("span", {
            onclick: () => {
                diagram.width = prompt("New diagram width?", diagram.width) || diagram.width
                updateJSONFromDiagram()
            },
            title: "Diagram width -- click to change"
        }, diagram.width),
        " X ",
        m("span", {
            onclick: () => {
                diagram.height = prompt("New diagram height?", diagram.height) || diagram.height
                updateJSONFromDiagram()
            },
            title: "Diagram height -- click to change"
        }, diagram.height),
        m("br"),
        m("button.ma1.pa1", { onclick: addElement.bind(null, "issue") }, 
            m("img.v-mid.mr1", { src: CompendiumIcons.issue_png, style: "width: 16px; height: 16px;" }), 
            "Question"
        ),
        m("button.ma1.pa1", { onclick: addElement.bind(null, "position") },
            m("img.v-mid.mr1", { src: CompendiumIcons.position_png, style: "width: 16px; height: 16px;" }), 
            "Idea"
        ),
        m("button.ma1.pa1", { onclick: addElement.bind(null, "plus") },
            m("img.v-mid.mr1", { src: CompendiumIcons.plus_png, style: "width: 16px; height: 16px;" }),
            "Pro"
        ),
        m("button.ma1.pa1", { onclick: addElement.bind(null, "minus") },
            m("img.v-mid.mr1", { src: CompendiumIcons.minus_png, style: "width: 16px; height: 16px;" }),
            "Con"
        ),
        m("button.ma1.pa1", { onclick: deleteElement }, "Delete"),
        m("button.ma1.pa1", { onclick: addLink }, "Link <--*"),
        m("button.ma1.pa1", { onclick: deleteLink }, "Unlink *"),
        m("br"),
        m("div", { style: "overflow: auto" }, [
            // on keydown does not seem to work here
            m("svg.diagram.ba", {
                width: diagram.width,
                height: diagram.height,
                onmousedown: onmousedownBackground,
                onmousemove: onmousemoveBackground,
                onmouseup: onmouseupBackground,
                onkeydown: onkeydown
            }, [
                viewArrowhead(),
                diagram.elements.map(element => viewLink(element)),
                diagram.elements.map(element => viewElement(element)),
            ]),
        ]),
        viewItemPanel(),
        viewJSONPanel(),
    ]
}, ".bg-blue.br4")
