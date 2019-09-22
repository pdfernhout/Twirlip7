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
import { UUID } from "./UUID.js"
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

const findURLRegex = /(http[s]?:\/\/)([\da-z.-]+)\.([a-z.]{2,6})([/\w.-]*)*\/?/

function viewElement(element) {
    const textLocation = diagram.textLocation || "bottom"
    const hasURL = findURLRegex.exec(element.name || "")
    const followLink = hasURL ? () => window.open(hasURL[0]) : undefined
    const extraStyling = hasURL ? ".underline-hover" : ""
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
        textLocation === "right"
            ? m("text" + extraStyling, {x: element.x + 24, y: element.y + 8, "text-anchor": "left", onclick: followLink}, element.name)
            : m("text" + extraStyling, {x: element.x, y: element.y + 34, "text-anchor": "middle", onclick: followLink}, element.name)
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

class Item {
    constructor(uuid) {
        this.uuid = uuid || UUID.uuidv4()
    }
}

class CollageMap {
    constructor(uuid) {
        this.uuid = {uuid: uuid}
    }

    getType() {
        p.findC(this.uuid, "type")
    }

    setType(type) {
        p.addTriple(this.uuid, "type", type)
    }

    getItems() {
        const result = []
        const bcMap = p.findBC(this.uuid, "item")
        for (let key in bcMap) {
            const uuid = bcMap[key]
            if (uuid) result.push(new Item(uuid))
        }
        return result
    }

    async addItem(item, summary) {
        // Keep a copy of essential information
        // TODO: if (summary) p.addTriple(getOrganizerName(), {itemSummary: item.uuid}, summary)
        await p.addTripleAsync(this.uuid, {item: item.uuid}, item.uuid)
    }

    deleteItem(item) {
        p.addTriple(this.uuid, {item: item.uuid}, null)
    }

    /*
    getSummaryForItem(uuid) {
        return p.findC(this.uuid, {itemSummary: uuid})
    }
    */

    view() {
        const items = this.getItems()
        return m("div.flex-auto.flex.flex-column",
            (loading || !compendiumFeatureSuggestionsTables)
                ? m("div", "Loading...")
                : [
                    items.length === 0 && m("div", "No items"),
                    items.map(item => m("div", item.uuid)),
                    m("div", m("button", {onclick: () => this.addItem(new Item())}, "Add item"))
                ],
            m("div.ma3.ba.b--light-silver.pa2.flex-auto.overflow-auto.nowrap",
                compendiumFeatureSuggestionsTables && SqlUtils.viewSqlTables(compendiumFeatureSuggestionsTables)
            )
        )
    }
}

function viewCollageList(uuid) {
    const title =  p.findC({collageUUID: uuid}, "title")
    return m("div", 
        m("div", "CollageList: ", uuid),
        m("div",
            m("span", "Title: ", title || "untitled"),
            m("button.ml2", {onclick: () => {
                const newTitle = prompt("new title?", title)
                if (newTitle) p.addTriple({collageUUID: uuid}, "title", newTitle)
            }}, "Rename")
        )
    )
}

function viewNode(uuid) {
    const type = p.findC({collageUUID: uuid}, "type")
    console.log("viewNode", uuid, type)
    if (type === "CollageList") return viewCollageList(uuid)
    return m("div", "unfinished: ", uuid, "type: ", type)
}

function makeNewCollageMap() {
    const uuid = p.uuidv4()
    p.addTriple({collageUUID: uuid}, "type", "CollageMap")
    collageUUID = uuid
    uuidChangedByApp(uuid)
}

function makeNewCollageList(title) {
    const uuid = p.uuidv4()
    p.addTriple({collageUUID: uuid}, "type", "CollageList")
    if (title) p.addTriple({collageUUID: uuid}, "title", title)
    collageUUID = uuid
    uuidChangedByApp(uuid)
}

let showFeatureSuggestions = false

const TwirlipCollageApp = {
    view: () => m("div.pa3.h-100.flex.flex-column", "Collage: ", collageUUID,
        m("div.ma2..pa2.ba",
            m("button.ml2", {onclick: () => makeNewCollageMap()}, "New Map"),
            m("button.ml2", {onclick: () => makeNewCollageList()}, "New List"),
        ),
        viewNode(collageUUID),
        m("button", {onclick: () => showFeatureSuggestions = !showFeatureSuggestions}, "toggle feature suggestions"),
        showFeatureSuggestions && m("div.ma3.ba.b--light-silver.pa2.flex-auto.overflow-auto.nowrap",
            compendiumFeatureSuggestionsTables && SqlUtils.viewSqlTables(compendiumFeatureSuggestionsTables)
        )
        // m("div", "Footer")
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
        console.log("p onloaded", streamId)
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
