"use strict"
/* eslint-disable no-console */

// defines m
import "./vendor/mithril.js"

import NameTracker from "./NameTracker.js"

import { Pointrel20190820 } from "./Pointrel20190820.js"

const p = new Pointrel20190820()
p.setDefaultApplicationName("sketcher")

const nameTracker = new NameTracker({
    hashNameField: "sketch",
    displayNameLabel: "Sketch",
    defaultName: "test",
    nameChangedCallback: updateSketch
})

function getSketchName() {
    return "sketch:" + nameTracker.name
}

let sketch = null

let lastSelectedItem = null
let draggedItem = null
let dragStart = {}
let boundsStart = {}
let lastDelta = {}
let draggedHandle = null
let newBounds = null
let lastBackgroundClick = null

let sketchViewportHeight = 500

function getCurrentSketchUUID() {
    return p.findC("sketcher", "current-sketch")
}

function resetForSketchChange() {
    let currentSketch = getCurrentSketchUUID() || p.uuidv4()
    sketch = new Sketch(currentSketch)
    lastSelectedItem = null
    draggedItem = null
    dragStart = {}
    boundsStart = {}
    lastDelta = {}
    draggedHandle = null
    newBounds = null
    lastBackgroundClick = null
}

async function startup() {
    p.setRedrawFunction(m.redraw)
    updateSketch()
}

async function updateSketch() {
    p.setStreamId(getSketchName())
    await p.updateFromStorage(true)
    resetForSketchChange()
    m.redraw()
}

function itemMouseDown(item, event) {
    draggedItem = item
    draggedHandle = null
    newBounds = null
    lastBackgroundClick = null
    if (event.ctrlKey && lastSelectedItem && lastSelectedItem.uuid === item.uuid) {
        lastSelectedItem = null
        return
    } else {
        lastSelectedItem = item
    }
    dragStart = { x: event.clientX, y: event.clientY }
    boundsStart = item.getBounds()
    lastDelta = {x: 0, y: 0}
    // Prevent switching into drag-and-drop sometimes
    event.preventDefault()
}

// For a drag handle
function handleMouseDown(handle, event) {
    if (!lastSelectedItem) return
    draggedHandle = handle
    draggedItem = null
    newBounds = null
    lastBackgroundClick = null
    dragStart = { x: event.clientX, y: event.clientY }
    boundsStart = lastSelectedItem.getBounds()
    lastDelta = {x: 0, y: 0}
    // Prevent switching into drag-and-drop sometimes
    event.preventDefault()
}

function sketchMouseDown(event) {
    // This happens even when item or handle has a mouse down
    // Reset selection if mouse down outside of any item or handle
    if (!draggedItem && !draggedHandle) lastSelectedItem = null
    lastBackgroundClick = { x: event.offsetX, y: event.offsetY }
}

function sketchMouseMove(event) {
    if (draggedItem) { 
        const dx = event.clientX - dragStart.x
        const dy = event.clientY - dragStart.y
        if (lastDelta.x === dx && lastDelta.y === dy) {
            event.redraw = false
            return
        }
        const bounds = draggedItem.getBounds()
        bounds.x1 = boundsStart.x1 + dx
        bounds.y1 = boundsStart.y1 + dy
        bounds.x2 = boundsStart.x2 + dx
        bounds.y2 = boundsStart.y2 + dy
        newBounds = bounds
        lastDelta = {x: dx, y: dy}
    } else if (draggedHandle) {
        const dx = event.clientX - dragStart.x
        const dy = event.clientY - dragStart.y
        if (lastDelta.x === dx && lastDelta.y === dy) {
            event.redraw = false
            return
        }
        const bounds = lastSelectedItem.getBounds()
        const type = lastSelectedItem.getType()

        if (draggedHandle === "x1y1" || draggedHandle === "x1y2") bounds.x1 = boundsStart.x1 + dx
        if (draggedHandle === "x1y1" || draggedHandle === "x2y1") bounds.y1 = boundsStart.y1 + dy
        if (draggedHandle === "x2y1" || draggedHandle === "x2y2") bounds.x2 = boundsStart.x2 + dx
        if (draggedHandle === "x1y2" || draggedHandle === "x2y2") bounds.y2 = boundsStart.y2 + dy

        if (type !== "line") {
            // Limit bounds to positive area
            bounds.x1 = Math.min(bounds.x1, boundsStart.x2 + 1)
            bounds.y1 = Math.min(bounds.y1, boundsStart.y2 + 1)
            bounds.x2 = Math.max(bounds.x2, boundsStart.x1 + 1)
            bounds.y2 = Math.max(bounds.y2, boundsStart.y1 + 1)
        }

        newBounds = bounds
        lastDelta = {x: dx, y: dy}
    } else {
        // Optimization: no need to redraw in Mithril
        event.redraw = false
    }
}

function sketchMouseUp() {
    if (newBounds) {
        if (draggedItem) {
            draggedItem.setBounds(newBounds)
        } else if (draggedHandle && lastSelectedItem) {
            lastSelectedItem.setBounds(newBounds)
        }
    }
    draggedItem = null
    draggedHandle = null
}

function insertLinksIntoText(text) {
    const result = []
    text.split(" ").forEach((each) => {
        if (result.length) {
            result.push(" ")
        }
        if (each.toLowerCase().startsWith("http")) {
            result.push(each)
            result.push(m("a", {"xlink:href": each, target: "_blank"}, " [🔗]"))
        } else {
            result.push(each)
        }
    })
    return result
}

function splitText(text, bounds) {
    const result = []
    const height = 18
    let y = bounds.y1 + height
    text.split("\n").forEach((each) => {
        result.push(m("tspan", {
            x: bounds.x1,
            y: y
        }, insertLinksIntoText(each)))
        y += height
    })
    return result
}

class Item {
    constructor(uuid) {
        this.uuid = uuid || p.uuidv4()
    }

    getType() {
        return p.findC(this.uuid, "type")
    }

    setType(type) {
        p.addTriple(this.uuid, "type", type)
    }

    getBounds() {
        let bounds = JSON.parse(p.findC(this.uuid, "bounds") || "{}")
        if (!bounds || (!bounds.x1 && !bounds.y1 && !bounds.x2 && !bounds.y2)) {
            bounds = {x1: 0, y1: 0, x2: 20, y2: 20}
        }
        if (newBounds) {
            // Check if there are temporary new bounds if this item is being moved or resized
            if (draggedItem && draggedItem.uuid === this.uuid) {
                bounds = newBounds
            } else if (draggedHandle && lastSelectedItem && lastSelectedItem.uuid === this.uuid) {
                bounds = newBounds
            }
        }
        return bounds
    }

    setBounds(bounds) {
        p.addTriple(this.uuid, "bounds", JSON.stringify(bounds))
    }

    getLayer() {
        return JSON.parse(p.findC(this.uuid, "layer") || "1")
    }

    setLayer(layer) {
        p.addTriple(this.uuid, "layer", JSON.stringify(layer))
    }

    getText() {
        return p.findC(this.uuid, "text") || ""
    }

    setText(text) {
        p.addTriple(this.uuid, "text", text)
    }

    getStroke() {
        return p.findC(this.uuid, "stroke") || "#006600"
    }

    setStroke(stroke) {
        p.addTriple(this.uuid, "stroke", stroke)
    }

    getStrokeWidth() {
        return p.findC(this.uuid, "strokeWidth") || "1"
    }

    setStrokeWidth(width) {
        p.addTriple(this.uuid, "strokeWidth", width)
    }

    getFill() {
        return p.findC(this.uuid, "fill") || "#00cc00"
    }

    setFill(text) {
        p.addTriple(this.uuid, "fill", text)
    }

    getArrows() {
        return p.findC(this.uuid, "arrows") || "none"
    }

    // none, start, end, both
    setArrows(arrows) {
        p.addTriple(this.uuid, "arrows", arrows)
    }

    draw() {
        const type = this.getType()
        let bounds = this.getBounds()

        if (type === "rectangle") {
            return m("rect", {
                key: this.uuid,
                x: bounds.x1,
                y: bounds.y1,
                // Set a minimum size for the rectangle for now
                width: Math.max(10, bounds.x2 - bounds.x1),
                height: Math.max(10, bounds.y2 - bounds.y1), 
                style: { 
                    stroke: this.getStroke(),
                    "stroke-width": this.getStrokeWidth(), 
                    fill: this.getFill()
                }, 
                onpointerdown: itemMouseDown.bind(this, this)
            })
        } else if (type === "circle") {
            return m("circle", {
                key: this.uuid,
                cx: bounds.x1 + Math.round((bounds.x2 - bounds.x1) / 2),
                cy: bounds.y1 + Math.round((bounds.y2 - bounds.y1) / 2),
                r: Math.round(Math.max(20, Math.min(bounds.x2 - bounds.x1, bounds.y2 - bounds.y1)) / 2), 
                style: {
                    stroke: this.getStroke(),
                    "stroke-width": this.getStrokeWidth(), 
                    fill: this.getFill()
                }, 
                onpointerdown: itemMouseDown.bind(this, this) 
            })
        } else if (type === "line") {
            const arrows = this.getArrows()
            return m("line", {
                key: this.uuid,
                x1: bounds.x1,
                y1: bounds.y1,
                x2: bounds.x2,
                y2: bounds.y2,
                style: {
                    stroke: this.getStroke(),
                    "stroke-width": this.getStrokeWidth(), 
                    fill: this.getFill()
                },
                "marker-end": (arrows === "end" || arrows === "both") ? "url(#arrow-start)" : null,
                "marker-start": (arrows === "start" || arrows === "both") ? "url(#arrow-end)" : null,
                onpointerdown: itemMouseDown.bind(this, this) 
            })
        } else if (type === "text") {
            return m("text", {
                key: this.uuid,
                x: bounds.x1,
                // TODO: Fix the baseline
                y: bounds.y1,
                // Set a minimum size for the rectangle for now
                width: Math.max(10, bounds.x2 - bounds.x1),
                height: Math.max(10, bounds.y2 - bounds.y1),
                // "inline-size": "250px",
                onpointerdown: itemMouseDown.bind(this, this) 
            },
            splitText(this.getText(), bounds)
            )
        } else {
            return m("text", {
                key: this.uuid,
                x: bounds.x1,
                // TODO: Fix the baseline
                y: bounds.y2,
            },
            "Unsupported type: " + type
            )
        }
    }
}

class Sketch {
    constructor(uuid) {
        this.uuid = uuid
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

    addItem(item) {
        p.addTriple(this.uuid, {item: item.uuid}, item.uuid)
    }

    deleteItem(item) {
        p.addTriple(this.uuid, {item: item.uuid}, null)
    }

    getExtent() {
        let extent = JSON.parse(p.findC(this.uuid, "extent") || "{}")
        if (!extent.width || !extent.height) {
            extent = {width: 600, height: 200}
        }
        return extent
    }

    setExtent(extent) {
        p.addTriple(this.uuid, "extent", JSON.stringify(extent))
    }

    setWidth(width) {
        const extent = this.getExtent()
        extent.width = parseInt(width)
        this.setExtent(extent)
    }

    setHeight(height) {
        const extent = this.getExtent()
        extent.height = parseInt(height)
        this.setExtent(extent)
    }
}

function calculateBounds() {
    const bounds = {x1: 0, y1: 0, x2: 50, y2: 50}
    if (lastBackgroundClick) {
        bounds.x1 += lastBackgroundClick.x
        bounds.x2 += lastBackgroundClick.x
        bounds.y1 += lastBackgroundClick.y
        bounds.y2 += lastBackgroundClick.y
    }
    return bounds
}

function addRectangle() {
    p.newTransaction("sketcher/addRectangle")
    const item = new Item()
    item.setType("rectangle")
    item.setBounds(calculateBounds())
    sketch.addItem(item)
    p.sendCurrentTransaction()
}

function addCircle() {
    p.newTransaction("sketcher/addCircle")
    const item = new Item()
    item.setType("circle")
    item.setBounds(calculateBounds())
    sketch.addItem(item)
    p.sendCurrentTransaction()
}

function addLine() {
    p.newTransaction("sketcher/addLine")
    const item = new Item()
    item.setType("line")
    item.setBounds(calculateBounds())
    item.setStrokeWidth("5")
    sketch.addItem(item)
    p.sendCurrentTransaction()
}

function addText() {
    const text = prompt("Text to add?")
    if (!text) return
    p.newTransaction("sketcher/addText")
    const item = new Item()
    item.setType("text")
    item.setBounds(calculateBounds())
    item.setText(text)
    sketch.addItem(item)
    p.sendCurrentTransaction()
}

function drawItems() {
    function compare(a, b) {
        const aLayer = a.getLayer()
        const bLayer = b.getLayer()
        if (aLayer < bLayer) return -1
        if (aLayer > bLayer) return 1
        if (a.uuid < b.uuid) return -1
        if (a.uuid > b.uuid) return 1
        throw new Error("uuids of different items in list should not be the same")
    }

    function handle(name, x, y) {
        return  m("circle", {
            cx: x,
            cy: y,
            r: 5, 
            style: {
                stroke: "#006600",
                fill: "#000000"
            },
            onpointerdown: handleMouseDown.bind(lastSelectedItem, name)
        })
    }

    function selection() {
        const item = lastSelectedItem
        if (!item) return []
        const bounds = item.getBounds()
        const type = item.getType()
        return m("g", [
            handle("x1y1", bounds.x1, bounds.y1),
            (type !== "line") ? handle("x1y2", bounds.x1, bounds.y2) : [],
            (type !== "line") ? handle("x2y1", bounds.x2, bounds.y1) : [],
            handle("x2y2", bounds.x2, bounds.y2),
        ])
    }

    const items = sketch.getItems()
    const sortedItems = items.sort(compare)
    const drawnItems = sortedItems.map((item) => {
        return item.draw()
    })

    return [
        drawnItems,
        selection()
    ]
}

function raiseItem() {
    const item = lastSelectedItem
    if (!item) return
    item.setLayer(item.getLayer() + 1)
}

function lowerItem() {
    const item = lastSelectedItem
    if (!item) return
    item.setLayer(item.getLayer() - 1)
}

function deleteItem() {
    const item = lastSelectedItem
    if (!item) return
    if (!confirm("Delete " + item.getType() + "?")) return
    lastSelectedItem = null
    sketch.deleteItem(item)
}

function exportSketchText() {
    function textForItem(item) {
        if (item.getType() === "text") return JSON.stringify(item.getBounds()) + "\n" + item.getText()
        return JSON.stringify({
            type: item.getType(),
            bounds: item.getBounds(),
            layer: item.getLayer(),
            text: item.getText(),
            stroke: item.getStroke(),
            strokeWidth: item.getStrokeWidth(),
            fill: item.getFill(),
            arrows: item.getArrows(),
        }, null, 4)
    }

    // const svgSketch = document.getElementsByClassName("sketch")[0]
    // console.log("svgSketch", svgSketch)
    const items = sketch.getItems().reverse()
    const texts = items.map(item => "==== " + item.uuid + " ====\n" + textForItem(item))
    console.log("texts", texts.join("\n\n"))
    alert("Exported text to console")
}

function displaySelectedItemProperties() {
    const item = lastSelectedItem
    if (!item) return m("div.mt2", [
        m("span.tr.w5.dib", "Sketch width"), m("input.ml1", { value: sketch.getExtent().width, onchange: (event) => sketch.setWidth(event.target.value) }),
        m("br"),
        m("span.tr.w5.dib", "Sketch height"), m("input.ml1", { value: sketch.getExtent().height, onchange: (event) => sketch.setHeight(event.target.value) }),
        m("br"),
        m("span.tr.w5.dib", "Sketch viewport height"), m("input.ml1", { value: sketchViewportHeight, onchange: (event) => sketchViewportHeight = event.target.value }),
    ])
    const type = item.getType()
    if (type === "text") return m("div.mt2", [
        "Text:",
        m("br"),
        m("textarea", { rows: 5, cols: 60,  value: item.getText(), onchange: (event) => item.setText(event.target.value) })
    ])
    const arrows = item.getArrows()
    return m("div.mt2", [
        m("span.tr.w4.dib", "Fill"), m("input.ml1", { value: item.getFill(), onchange: (event) => item.setFill(event.target.value) }),
        m("br"),
        m("span.tr.w4.dib", "Stroke"), m("input.ml1", { value: item.getStroke(), onchange: (event) => item.setStroke(event.target.value) }),
        m("br"),
        m("span.tr.w4.dib", "Stroke width"), m("input.ml1", { value: item.getStrokeWidth(), onchange: (event) => item.setStrokeWidth(event.target.value) }),
        (type === "line") ? [
            m("br"),
            m("span.tr.w4.dib", "Arrows"), m("select.ml1", { value: arrows, onchange: (event) => item.setArrows(event.target.value) }, [
                m("option", {value: "none", selected: arrows === "none" }, "none"),
                m("option", {value: "start", selected: arrows === "start" }, "start"),
                m("option", {value: "end", selected: arrows === "end" }, "end"),
                m("option", {value: "both", selected: arrows === "both" }, "both"),
            ]),
        ] : []
    ])
}

function displayActions() {
    return m("div.mt1.mb1", [
        m("button", { onclick: addRectangle }, "Add Rectangle"),
        m("button.ml1", { onclick: addCircle }, "Add Circle"),
        m("button.ml1", { onclick: addText }, "Add Text"),
        m("button.ml1", { onclick: addLine }, "Add Line"),
        m("button.ml3", { onclick: raiseItem }, "Raise"),
        m("button.ml1", { onclick: lowerItem }, "Lower"),
        m("button.ml3", { onclick: deleteItem }, "Delete"),
        m("button.ml3", { onclick: exportSketchText }, "Export Text"),
    ])
}

function svgMarkers() {
    return [
        m("marker", {
            id: "arrow-start",
            markerHeight: "10",
            markerUnits: "strokeWidth",
            markerWidth: "10",
            orient: "auto",
            refX: "2",
            refY: "1.5"
        }, [
            m("path", {
                d: "M0,0 L0,3 L3,1.5 z",
                fill: "black"
            })
        ]),
        m("marker", {
            id: "arrow-end",
            markerHeight: "10",
            markerUnits: "strokeWidth",
            markerWidth: "10",
            orient: "auto",
            refX: "1",
            refY: "1.5"
        }, [
            m("path", {
                d: "M3,0 L3,3 L0,1.5 z",
                fill: "black"
            })
        ])
    ]
}

function displaySketch() {
    const extent = sketch.getExtent()
    return m("div",
        displayActions(),
        m("div",
            {
                style: {
                    "max-height": sketchViewportHeight + "px",
                    "max-width": "100%",
                    border: "2px solid #000",
                    overflow: "scroll",
                }
            },
            m("svg.sketch", 
                {
                    width: extent.width,
                    height: extent.height,
                    onpointerdown: sketchMouseDown,
                    onpointermove: sketchMouseMove,
                    onpointerup: sketchMouseUp,
                    "font-family": "Times New Roman",
                    "font-style": "normal",
                    "font-variant": "normal",
                    "font-weight": "400",
                    "font-size": "16px",
                    "font-size-adjust": "none",
                    "font-stretch": "100%",
                    style: {
                        "touch-action": "none"
                    },
                },
                m("defs", svgMarkers()),
                m("rect", {
                    width: extent.width,
                    height: extent.height,
                    style: { fill: "none", stroke: "#006600" } 
                }),
                drawItems()
            )
        ),
        displaySelectedItemProperties()
    )
}

function promptToCreateSketch() {
    const uuid = prompt("Start a sketch with this UUID?", sketch.uuid)
    if (!uuid) return
    sketch.uuid = uuid
    p.addTriple("sketcher", "current-sketch", uuid)
}

const SketchViewer = {
    view: function() {
        return m(".main.ma1", [
            p.isOffline() ? m("div.h2.pa1.ba.b--red", "OFFLINE", m("button.ml1", { onclick: p.goOnline }, "Try to go online")) : [],
            nameTracker.displayNameEditor(),
            p.isLoaded()
                ? getCurrentSketchUUID()
                    ? displaySketch()
                    : m("button.ma3", {onclick: promptToCreateSketch}, "No sketch here yet. Click to start a sketch.")
                : "Loading... " + (p.getLatestSequence() || "")
        ])
    }
}

m.mount(document.body, SketchViewer)

startup()
