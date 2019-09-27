// Collage application

// Compendium/IBIS-like app
// Thanks for the inspiration, Al, and good luck with whatever you are up to now...

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

**************************************/

/* eslint-disable no-console */
/* global CompendiumIcons */

"use strict"

// defines CompendiumIcons
import "./examples/ibis_icons.js"

// defines m
import "./vendor/mithril.js"

import { HashUUIDTracker } from "./HashUUIDTracker.js"
import { Pointrel20190914 } from "./Pointrel20190914.js"
import { CanonicalJSON } from "./CanonicalJSON.js"
import { SqlUtils } from "./SqlUtils.js"

const p = new Pointrel20190914()

// import { FileUtils } from "./FileUtils.js"
// import { UUID } from "./UUID.js"

let compendiumFeatureSuggestionsTables = null

let collageUUID
let userID = localStorage.getItem("userID") || "anonymous"

function userIDChange(event) {
    userID = event.target.value
    // TODO: Fix how userId is handled with Pointrel20190914
    // backend.configure(undefined, userID)
    localStorage.setItem("userID", userID)
}

/* 
// For debugging -- does not work
const mOld = m
m = function(...args) {
    for (let i = 0; i < arguments.length; i++) {
        if (args[i] === undefined) throw new Error("undefined arg #" + i)
    }
    mOld(...args)
}
m.mount = mOld.mount
*/

/*

let diagram = {
    width: 800,
    height: 500,
    diagramName: "Untitled IBIS Diagram",
    elements: [],
    textLocation: "right"
}

let isItemPanelDisplayed = false

let diagramJSON = JSON.stringify(diagram, null, 4)
let isJSONPanelDisplayed = false

let outlineText = ""
let isImportOutlinePanelDisplayed = false

// tiny stack for connecting items
let earlierDraggedItem = null
let laterDraggedItem = null

let draggedItem = null
let dragStart = {x: 0, y: 0}
let objectStart = {x: 0, y: 0}

const messages = []

let unsaved = false

const delta = 60

let lastClickPosition = {x: delta, y: delta}

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

function addElement(type, name, parentId) {
    if (!name) name = prompt(type + " name")
    if (!name) return
    const x = lastClickPosition.x + delta
    const y = lastClickPosition.y + delta
    const element = { type: type, name: name, x: x, y: y, notes: "", id: UUID.uuidv4() }
    if (parentId) element.parentId = parentId
    diagram.elements.unshift(element)
    if (lastClickPosition) {
        lastClickPosition.x += delta
        lastClickPosition.y += delta
    }
    earlierDraggedItem = laterDraggedItem
    laterDraggedItem = element
    updateJSONFromDiagram()
    return element
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

const findURLRegex = /(http[s]?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?/

function updateJSONFromDiagram() {
    diagramJSON = JSON.stringify(diagram, null, 4)
    unsaved = true
}

function updateDiagramFromJSON() {
    const newDiagram = JSON.parse(diagramJSON)
    diagram = newDiagram
}

function viewItemPanel() {
    const element = laterDraggedItem
    const disabled = !element

    return m("div.ma1", [
        isItemPanelDisplayed ? [
            m("div", "Type"),
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

function clearDiagram() {
    if (!confirm("Clear diagram?")) return
    diagram.elements = []
    updateJSONFromDiagram()
    lastClickPosition = {x: delta, y: delta}
}

function viewCheckboxesPanel() {
    return m("div.ma1",
        m("input[type=checkbox].ma1", {
            checked: isItemPanelDisplayed,
            onchange: event => isItemPanelDisplayed = event.target.checked
        }),
        "Edit Item",
        m("input[type=checkbox].ma1.ml3", {
            checked: isJSONPanelDisplayed,
            onchange: event => isJSONPanelDisplayed = event.target.checked
        }),
        m("span", "Edit Diagram as JSON"),
        m("input[type=checkbox].ma1.ml3", {
            checked: isImportOutlinePanelDisplayed,
            onchange: event => isImportOutlinePanelDisplayed = event.target.checked
        }),
        m("span", "Import outline"),
    )
}

function viewJSONPanel() {
    return m("div",
        isJSONPanelDisplayed ? [
            m("div", "JSON:"),
            m("textarea.w-100", {
                height: "20rem", value: diagramJSON,
                oninput: (event) => diagramJSON = event.target.value
            }),
            m("button.ma1", { onclick: updateDiagramFromJSON }, "Update Diagram from JSON"),
        ] : [],
    )
}

function viewOutlinePanel() {
    return  m("div",
        isImportOutlinePanelDisplayed ? [
            m("div", "Outline:"),
            m("textarea.w-100", {
                height: "20rem", value: outlineText,
                oninput: (event) => outlineText = event.target.value
            }),
            m("br"),
            m("button.ma1", { onclick: clearDiagram }, "Clear diagram"),
        ] : []
    )
}

function changeDiagramName() {
    const newDiagramName = prompt("Diagram name?", diagram.diagramName)
    if (newDiagramName) diagram.diagramName = newDiagramName
}

function view() {
    return m("div.bg-blue.br4.pa3.h-100.w-100.flex.flex-column.overflow-hidden",
        m("div.flex-none",
            m("span", "Issue Based Information System (IBIS) for Dialogue Mapping"),
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
            unsaved ? " [UNSAVED]" : ""
        ),
        m("div.mt1.mb1.flex-none",
            m("button.ma1.pa1", { onclick: addElement.bind(null, "issue", null, null) },
                m("img.v-mid.mr1", { src: CompendiumIcons.issue_png, style: "width: 16px; height: 16px;" }),
                "Question"
            ),
            m("button.ma1.pa1", { onclick: addElement.bind(null, "position", null, null) },
                m("img.v-mid.mr1", { src: CompendiumIcons.position_png, style: "width: 16px; height: 16px;" }),
                "Idea"
            ),
            m("button.ma1.pa1", { onclick: addElement.bind(null, "plus", null, null) },
                m("img.v-mid.mr1", { src: CompendiumIcons.plus_png, style: "width: 16px; height: 16px;" }),
                "Pro"
            ),
            m("button.ma1.pa1", { onclick: addElement.bind(null, "minus", null, null) },
                m("img.v-mid.mr1", { src: CompendiumIcons.minus_png, style: "width: 16px; height: 16px;" }),
                "Con"
            ),
            m("button.ma1.pa1", { onclick: deleteElement }, "Delete"),
            m("button.ma1.pa1", { onclick: addLink }, "Link <--*"),
            m("button.ma1.pa1", { onclick: deleteLink }, "Unlink *"),
            m("select.ma1.pa1", { onchange: (event) => diagram.textLocation = event.target.value },
                m("option", { value: "right", selected: diagram.textLocation === "right" }, "text at right"),
                m("option", { value: "bottom", selected: diagram.textLocation === "bottom" || !diagram.textLocation }, "text at bottom"),
            )
        ),
        m("div.flex-auto.overflow-auto", [
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
        viewImportExportPanel(),
        viewCheckboxesPanel(),
        viewItemPanel(),
        viewJSONPanel(),
        viewOutlinePanel()
    )
}

*/

// Make (invisible) arrowhead marker which is then used by lines
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

function myWrap(offset, itemText, maxWidth) {
    const lineHeight_rem = 0.9
    const words = itemText.split(/\s+/)
    const lines = []
    let line = ""
    words.forEach((word, index) => {
        // if (lines.length >= 5) {
        //    line = "..."
        //    return
        // }
        if (line === "") {
            line = word
        } else if ((line + " " + word).length < maxWidth + 7) {
            line += " " + word
        } else {
            lines.push(line)
            line = word
        }
    })
    if (line !== "") lines.push(line)
    let lineNumber = 0
    return lines.map((line, index) => {
        return m("tspan", {
            x: offset.x,
            y: offset.y,
            dy: (lineNumber++) * lineHeight_rem  + "rem",
        }, line)
    }) 
}

let textLocation = "bottom"

function viewMapLink(mapLink, origin, nodes) {
    const fromNode = nodes[mapLink.fromNode]
    const toNode = nodes[mapLink.toNode]

    if (!fromNode || !toNode) return []

    const x1 = (toNode.xPos || 0) - origin.x
    const y1 = (toNode.yPos || 0) - origin.y
    const x2 = (fromNode.xPos || 0) - origin.x
    const y2 = (fromNode.yPos || 0) - origin.y

    const xA = x1
    const yA = y1
    const xB = x2
    const yB = y2
    const radius = 24

    const d = Math.sqrt((xB - xA) * (xB - xA) + (yB - yA) * (yB - yA))
    const d2 = d - radius

    const ratio = d === 0 ? 0 : d2 / d

    const dx = (xB - xA) * ratio
    const dy = (yB - yA) * ratio

    const x = xA + dx
    const y = yA + dy

    if (isNaN(x)) {
        throw new Error("Error in link drawing")
    }

    return m("line", {
        x1: x,
        y1: y,
        x2: x2 - dx,
        y2: y2 - dy,
        "marker-end": "url(#arrowhead)",
        stroke: "black",
        "stroke-width": 1
    })
}

function viewMapItem(mapItem, origin) {
    // const textLocation = diagram.textLocation || "bottom"
    // const hasURL = findURLRegex.exec(mapItem.label || "")
    // const followLink = hasURL ? () => window.open(hasURL[0]) : undefined
    const followLink = undefined
    // const extraStyling = hasURL ? ".underline-hover" : ""
    const extraStyling = ""
    const textParams = (textLocation === "right")
        ? {width: "" + mapItem.labelWrapWidth + "rem", height: "auto", x: -origin.x + mapItem.x + 24, y: -origin.y + mapItem.y + 8, "text-anchor": "left", onclick: followLink}
        : {width: "" + mapItem.labelWrapWidth + "rem", height: "auto", x: -origin.x + mapItem.x, y: -origin.y + mapItem.y + 34, "text-anchor": "middle", onclick: followLink}

    return [
        // mapItem === laterDraggedItem ?
        //     m("text", {x: mapItem.x, y: mapItem.y - 20, "text-anchor": "middle"}, "*") :
        //     mapItem === earlierDraggedItem ?
        //         m("text", {x: mapItem.x, y: mapItem.y - 20, "text-anchor": "middle"}, "<") :
        //        [],
        m("image", {
            "xlink:href": CompendiumIcons[mapItem.type + "_png"],
            x: -origin.x + mapItem.x - 16,
            y: -origin.y + mapItem.y - 16,
            width: 32,
            height: 32,
            alt: mapItem.type,
            // onmousedown: (event) => onmousedown(mapItem, event),
        }),
        m("text.f6" + extraStyling, textParams, myWrap({x: textParams.x, y: textParams.y}, mapItem.label, mapItem.labelWrapWidth))
    ]
}

function viewMap(uuid) {
    const mapId = {collageUUID: uuid}

    const mapViewLinks = Object.values(p.findBC(mapId, "hasLink"))
    const mapLinks = mapViewLinks.map(link => {
        const id = link.id
        return {
            fromNode: p.findC({collageUUID: id}, "fromNode") || "MISSING_FROM",
            toNode: p.findC({collageUUID: id}, "toNode") || "MISSING_FROM",
        }
    })

    const nodes = {}

    const mapViewItems = Object.values(p.findBC(mapId, "contains"))
    const mapItems = mapViewItems.map(item => {
        const id = item.id
        nodes[id] = item
        let type = p.findC({collageUUID: id}, "type") || "missing"
        type = type.charAt(0).toLowerCase() + type.substring(1)
        if (type === "pro") type = "plus"
        if (type === "con") type = "minus"
        return {
            id: {collageUUID: id},
            label: p.findC({collageUUID: id}, "label") || "",
            labelWrapWidth: item.labelWrapWidth,
            type: type,
            x: item.xPos || 0,
            y: item.yPos || 0,
            // detail: p.findC(id, "detail")
        }
    })
    // mapItems.sort((a, b) => a.label.localeCompare(b.label))
    
    const label =  p.findC(mapId, "label")

    // Determine map bounds
    let xSizeMin = 0
    let ySizeMin = 0
    let xSizeMax = 500
    let ySizeMax = 500
    const extraSize = 200
    for (let mapItem of mapItems) {
        if (mapItem.x - extraSize < xSizeMin) xSizeMin = mapItem.x - extraSize
        if (mapItem.x + extraSize > xSizeMax) xSizeMax = mapItem.x + extraSize
        if (mapItem.y - 50 < ySizeMin) ySizeMin = mapItem.y - 50
        if (mapItem.y + extraSize > ySizeMax) ySizeMax = mapItem.y + extraSize
    }
    const xSizeMap = xSizeMax - xSizeMin
    const ySizeMap = ySizeMax - ySizeMin
    const origin = {x: xSizeMin, y: ySizeMin}

    return m("div", 
        m("div", "Map: ", uuid),
        m("div.mt2", 
            "Label: ",
            m("button.ml2.mr2", {onclick: () => {
                const newLabel = prompt("new label?", label)
                if (newLabel) p.addTriple({collageUUID: uuid}, "label", newLabel)
            }}, "✎"),
            label || "unlabelled"
        ),
        m("div.overflow-auto", 
            {
                style: {
                    width: "" + Math.min(xSizeMap, document.body.clientWidth - 100) + "px",
                    height: "" + Math.min(ySizeMap, document.body.clientHeight - 200) + "px"
                }
            }, 
            m("svg.diagram.ba", 
                {
                    width: xSizeMap,
                    height: ySizeMap
                },
                viewArrowhead(),
                mapItems.map(mapItem => viewMapItem(mapItem, origin)),
                mapLinks.map(mapLink => viewMapLink(mapLink, origin, nodes))
            )
        ),
    )
}

let editedNote = null

function viewNote(uuid) {
    if (uuid !== editedNote) editedNote = null

    const label =  p.findC({collageUUID: uuid}, "label")
    const detail =  p.findC({collageUUID: uuid}, "detail") || ""
    return m("div", 
        m("div", "Note: ", uuid),
        m("div.mt2", 
            "Label: ",
            m("button.ml2.mr2", {onclick: () => {
                const newLabel = prompt("new label?", label)
                if (newLabel) p.addTriple({collageUUID: uuid}, "label", newLabel)
            }}, "✎"),
            label || "unlabelled"
        ),
        m("div.mt2",
            "Detail:",
            m("button.ml2", {onclick: () => editedNote ? editedNote = null : editedNote = uuid}, "✎"),
            m("div",
                editedNote 
                    ? m("textarea", {rows: 10, cols: 80, value: detail, onchange: (event) => {
                        p.addTriple({collageUUID: uuid}, "detail", event.target.value)
                    }})
                    : m("pre", {style: "white-space: pre-wrap", }, detail)
                
            )
        )
    )
}

function promptForNewItemForList(listId) {
    const itemLabel = prompt("New item?")
    if (!itemLabel) return

    // TODO: Pick the type
    const itemId = makeNewNode("Note", itemLabel)

    p.addTriple(listId, {contains: itemId}, {id: itemId, position: "???"})
}

function viewList(uuid) {
    const listId = {collageUUID: uuid}
    const listItemIds = Object.values(p.findBC(listId, "contains")).map(item => item.id)
    const listItems = listItemIds.map(id => {
        let type = p.findC({collageUUID: id}, "type") || "missing"
        type = type.charAt(0).toLowerCase() + type.substring(1)
        if (type === "pro") type = "plus"
        if (type === "con") type = "minus"
        return {
            id: {collageUUID: id},
            label: p.findC({collageUUID: id}, "label") || "",
            type: type
            // detail: p.findC(id, "detail")
        }
    })
    listItems.sort((a, b) => a.label.localeCompare(b.label))
    
    const label =  p.findC(listId, "label")
    return m("div", 
        m("div", "List: ", uuid),
        m("div.mt2", 
            "Label: ",
            m("button.ml2.mr2", {onclick: () => {
                const newLabel = prompt("new label?", label)
                if (newLabel) p.addTriple({collageUUID: uuid}, "label", newLabel)
            }}, "✎"),
            label || "unlabelled"
        ),
        listItems.map(item => 
            m("div.ma2", 
                {
                    onclick: () => {
                        collageUUID = item.id.collageUUID
                        uuidChangedByApp(collageUUID)
                    }
                }, 
                m("img.mr2.v-mid", {
                    "src": CompendiumIcons[item.type + "_png"],
                    style: "width: 32px; height: 32px",
                    alt: item.type
                }),
                item.label
            )
        ),
        m("button", {onclick: () => promptForNewItemForList(listId)}, "Add list item")
    )
}

function viewNode(uuid) {
    if (!uuid) throw new Error("viewNode: uuid is not defined: " + uuid)
    let type = p.findC({collageUUID: uuid}, "type")
    // console.log("viewNode", uuid, type)
    if (type === "List") return viewList(uuid)
    if (type === "Map") return viewMap(uuid)
    // if (type === "Map") return viewList(uuid)
    if (type === "Note") return viewNote(uuid)
    // TODO -- improve views
    return viewNote(uuid)
    // return m("div", "unfinished: ", uuid, " type: ", type || "MISSING TYPE")
}

// Type of Map, List, Note
function makeNewNode(type, label, detail) {
    const uuid = p.uuidv4()
    const id = {collageUUID: uuid}
    p.addTriple(id, "type", type)
    p.addTriple({workspace: "test", type: type}, {instance: id}, id)
    if (label) p.addTriple(id, "label", label)
    if (detail) p.addTriple(id, "detail", detail)
    return id
}

function makeNewMap(label) {
    const uuid = makeNewNode("Map").collageUUID
    collageUUID = uuid
    uuidChangedByApp(uuid)
}

function getAllMaps() {
    return Object.values(p.findBC({workspace: "test", type: "Map"}, "instance"))
}

function makeNewList(label) {
    const uuid = makeNewNode("List").collageUUID
    collageUUID = uuid
    uuidChangedByApp(uuid)
}

function getAllLists() {
    return Object.values(p.findBC({workspace: "test", type: "List"}, "instance"))
}

function getAllLinks() {
    return Object.values(p.findBC({workspace: "test", type: "Link"}, "instance"))
}

const expanded = {}
function expander(name, callback) {
    return m("div.ma1",
        name,
        m("span.ml2", {
            onclick: () => expanded[name] = !expanded[name]
        }, expanded[name] ? "▾" : "▸" ),
        expanded[name] && m("div.ml3", callback())
    )
}

function sortItems(a, b) {
    const aLabel = p.findC(a, "label") || a.collageUUID
    const bLabel = p.findC(b, "label") || b.collageUUID
    return aLabel.localeCompare(bLabel)
}

function viewLists() {
    return expander("Lists", () => 
        m("div", getAllLists().sort(sortItems).map(item =>
            m("div",
                {onclick: () => {
                    collageUUID = item.collageUUID
                    uuidChangedByApp(collageUUID)
                }},
                p.findC(item, "label") || item.collageUUID
            )
        ))
    )
}

function viewMaps() {
    return expander("Maps", () => 
        m("div", getAllMaps().sort(sortItems).map(item =>
            m("div", 
                {onclick: () => {
                    collageUUID = item.collageUUID
                    uuidChangedByApp(collageUUID)
                }}, 
                p.findC(item, "label") || item.collageUUID
            )
        ))
    ) 
}

function sortLinks(a, b) {
    const aFrom = p.findC(a, "fromNode") || ""
    const bFrom = p.findC(b, "fromNode") || ""
    if (aFrom === bFrom) {
        const aTo = p.findC(a, "toNode") || ""
        const bTo = p.findC(b, "toNode") || ""
        return aTo.localeCompare(bTo)
    }
    return aFrom.localeCompare(bFrom)
}

function viewLinks() {
    return expander("Links", () => 
        m("div", getAllLinks().sort(sortLinks).map(link => {
            const fromNode = p.findC(link, "fromNode") || "MISSING_FROM"
            const fromLabel = p.findC({collageUUID: fromNode}, "label") || ""
            const toNode = p.findC(link, "toNode") || "MISSING_TO"
            const toLabel = p.findC({collageUUID: toNode}, "label") || ""
            return m("div", 
                {onclick: () => {
                    collageUUID = link.collageUUID
                    uuidChangedByApp(collageUUID)
                }},
                m("span", link.collageUUID),
                " :: ",
                m("span", {title: fromLabel}, fromNode),
                " --> ",
                m("span", {title: toLabel}, toNode),
            )
        }))
    ) 
}

function importNodeTable(nodeTable) {
    console.log("nodeTable", nodeTable)
    for (let node of nodeTable) {
        const id = {collageUUID: node.NodeID}
        for (let fieldName of [
            "Author",
            "CreationDate",
            "CurrentStatus",
            "Detail",
            "ExtendedNodeType",
            "Label",
            "LastModAuthor",
            "ModificationDate",
            "NodeID",
            "NodeType",
            "OriginalID"
        ]) {
            let value = node[fieldName]
            if (fieldName.endsWith("Date")) value = new Date(value).toISOString()
            if (fieldName === "Detail") value = value.replace(/\\n/g, "\n")
            const fieldNameAdjusted = fieldName.charAt(0).toLowerCase() + fieldName.substring(1)
            p.addTriple(id, fieldNameAdjusted, value)
        }
        const typeName = {
            0: "General",

            1: "List",
            2: "Map",
            3: "Issue",
            4: "Position",
            5: "Argument",
            6: "Pro",
            7: "Con",
            8: "Decision",
            9: "Reference",
            10: "Note",

            11: "ListShortcut",
            12: "MapShortcut",
            13: "IssueShortcut",
            14: "PositionShortcut",
            15: "ArgumentShortcut",
            16: "ProShortcut",
            17: "ConShortcut",
            18: "DecisionShortcut",
            19: "ReferenceShortcut",
            20: "NoteShortcut",

            21: "PlannerMap",
            22: "MovieMap",
            31: "PlannerMapShortcut",
            32: "MovieMapShortcut",

            // trashbin and inbox are system nodes with only one instance
            51: "Trashbin",
            52: "Inbox",
        }[node.NodeType]
        p.addTriple(id, "type", typeName)
        p.addTriple({workspace: "test", type: typeName}, {instance: id}, id)
    }
}

function importViewNodeTable(viewNodeTable) {
    console.log("viewNodeTable", viewNodeTable)
    for (let row of viewNodeTable) {
        const id = {collageUUID: row.ViewID}
        const modifiedRow = {}
        for (let fieldName of [
            "Background",
            "CreationDate",
            "CurrentStatus",
            "FontFace",
            "FontSize",
            "FontStyle",
            "Foreground",
            "HideIcon",
            "LabelWrapWidth",
            "ModificationDate",
            "NodeID",
            "ShowTags",
            "ShowText",
            "ShowTrans",
            "ShowWeight",
            "SmallIcon",
            "ViewID",
            "XPos",
            "YPos"
        ]) {
            let value = row[fieldName]
            if (fieldName.endsWith("Date")) {
                value = new Date(value).toISOString()
                row[fieldName] = value
            }
            const fieldNameAdjusted = fieldName.charAt(0).toLowerCase() + fieldName.substring(1)
            modifiedRow[fieldNameAdjusted] = value
        }
        modifiedRow.id = modifiedRow.nodeID
        // console.log("adding for ", modifiedRow.id, {contains: modifiedRow.id})
        p.addTriple(id, {contains: modifiedRow.id}, modifiedRow)
    }
}

const linkTypeNumberToName = {
    39: "RespondsTo",
    40: "Supports",
    41: "ObjectsTo",
    42: "Challenges",
    43: "Specializes",
    44: "ExpandsOn",
    45: "RelatedTo",
    46: "About"
}

function importLinkTable(linkTable) {
    console.log("linkTable", linkTable)
    for (let link of linkTable) {
        const id = {collageUUID: link.LinkID}
        for (let fieldName of [
            "Author",
            "CreationDate",
            "CurrentStatus",
            "FromNode",
            "Label",
            "LinkID",
            "LinkType",
            "ModificationDate",
            "OriginalID",
            "ToNode"
        ]) {
            let value = link[fieldName]
            if (fieldName.endsWith("Date")) {
                value = new Date(value).toISOString()
            }
            if (fieldName === "LinkType") value = linkTypeNumberToName[value] || "RespondsTo"
            const fieldNameAdjusted = fieldName.charAt(0).toLowerCase() + fieldName.substring(1)
            p.addTriple(id, fieldNameAdjusted, value)
        }
        p.addTriple(id, "type", "Link")
        p.addTriple({workspace: "test", type: "Link"}, {instance: id}, id)
    }
}
     
function importViewLinkTable(viewLinkTable) {
    console.log("viewLinkTable", viewLinkTable)
    for (let row of viewLinkTable) {
        const id = {collageUUID: row.ViewID}
        const modifiedRow = {}
        for (let fieldName of [
            "ArrowType",
            "Background",
            "CreationDate",
            "CurrentStatus",
            "FontFace",
            "FontSize",
            "FontStyle",
            "Foreground",
            "LabelWrapWidth",
            "LinkColour",
            "LinkDashed",
            "LinkID",
            "LinkStyle",
            "LinkWeight",
            "ModificationDate",
            "ViewID"
        ]) {
            let value = row[fieldName]
            if (fieldName.endsWith("Date")) {
                value = new Date(value).toISOString()
                row[fieldName] = value
            }
            const fieldNameAdjusted = fieldName.charAt(0).toLowerCase() + fieldName.substring(1)
            modifiedRow[fieldNameAdjusted] = value
        }
        modifiedRow.id = modifiedRow.linkID
        // TODO: Maybe "hasLink" should be "contains" with some way to distinguish links from other items?
        p.addTriple(id, {hasLink: modifiedRow.id}, modifiedRow)
    }
}

function importFeatureSuggestions() {
    if (!confirm("Import feature suggestions?\n(This adds a lot of data.)")) return
    console.log("compendiumFeatureSuggestionsTables", compendiumFeatureSuggestionsTables)
    const nodeTable = compendiumFeatureSuggestionsTables["Node"]
    importNodeTable(nodeTable)
    const viewNodeTable = compendiumFeatureSuggestionsTables["ViewNode"]
    importViewNodeTable(viewNodeTable)
    const linkTable = compendiumFeatureSuggestionsTables["Link"]
    importLinkTable(linkTable)
    const viewLinkTable = compendiumFeatureSuggestionsTables["ViewLink"]
    importViewLinkTable(viewLinkTable)
}

function viewCollageButtons() {
    return m("div.ma1.pa1",
        m("button.ml2", {onclick: () => makeNewMap()}, "New Map"),
        m("button.ml2", {onclick: () => makeNewList()}, "New List"),
        m("button.ml2", {onclick: () => importFeatureSuggestions()}, "Import Feature Suggestions"),
        m("button.ml2", {onclick: () => console.log(p)}, "Debug P"),
    )
}

const TwirlipCollageApp = {
    view: () => m("div.pa3.h-100.overflow-auto",
        m("div.mt2.fixed", {style: {top: "0px", right: "20px"}}, p.isLoading() ? m("i.fa.fa-spinner.fa-spin") : ""),
        // m("b", "Twirlip Collage: ", collageUUID),
        m(".mb2.pa2.ba.br3", viewNode(collageUUID)),
        viewLists(),
        viewMaps(),
        // viewLinks(),
        viewCollageButtons(),
        expander("Feature Suggestions", () =>
            m("div.ma3.ba.b--light-silver.pa2",
                compendiumFeatureSuggestionsTables && SqlUtils.viewSqlTables(compendiumFeatureSuggestionsTables)
            )
        ),
    )
}

const { uuidChangedByApp, getUUID } = HashUUIDTracker("collageUUID", (uuid) => {
    // Called every time UUID changed from hash in the URL
    collageUUID = uuid
})

collageUUID = getUUID()

// TODO: optimize exessive stringify use
function isUUIDMatch(a, b) {
    return CanonicalJSON.stringify(a) === CanonicalJSON.stringify(b)
}

let loading = true

p.connect({
    onLoaded: (streamId) => {
        // console.log("p onloaded", streamId)
        if (isUUIDMatch(streamId, {collageUUID: collageUUID})) {
            loading = false
        }
    }
})

m.mount(document.body, TwirlipCollageApp)

async function loadCompendiumFeatureSuggestions() {
    const response = await fetch("examples/feature_suggestions_compendium_map.sql")
    const fileContents = await response.text()
    compendiumFeatureSuggestionsTables = SqlUtils.parseSqlIntoTables(fileContents)
    m.redraw()
    return fileContents
}

loadCompendiumFeatureSuggestions()
