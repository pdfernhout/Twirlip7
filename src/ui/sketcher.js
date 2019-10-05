"use strict"
/* eslint-disable no-console */

// defines m
import "./vendor/mithril.js"

import NameTracker from "./NameTracker.js"

import { ItemMap, drawPolylines } from "./ItemMap.js"

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

let sketchViewportHeight = 500

const itemMap = ItemMap()

function getCurrentSketchUUID() {
    return p.findC("sketcher", "current-sketch")
}

function resetForSketchChange() {
    let currentSketch = getCurrentSketchUUID() || p.uuidv4()
    sketch = new Sketch(currentSketch)
    itemMap.initDragInformation()
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

function raiseItem() {
    itemMap.getSelectedItems().forEach(item => item.setLayer(item.getLayer() + 1))
}

function lowerItem() {
    itemMap.getSelectedItems().forEach(item => item.setLayer(item.getLayer() - 1))
}

function deleteItem() {
    const selectedItems = itemMap.getSelectedItems()
    if (!selectedItems.length) return
    if (!confirm("Delete " + selectedItems.length + " item(s)?")) return
    selectedItems.forEach(item => sketch.deleteItem(item))
    itemMap.deselectAllItems()
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
            bounds =  { x1: 0, y1: 0, x2: 20, y2: 20 }
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

    // To support sketch of segments of polylines
    getExtraData() {
        return p.findC(this.uuid, "extraData") || null
    }

    setExtraData(extraData) {
        p.addTriple(this.uuid, "extraData", extraData)
    }

    getArrows() {
        return p.findC(this.uuid, "arrows") || "none"
    }

    // none, start, end, both
    setArrows(arrows) {
        p.addTriple(this.uuid, "arrows", arrows)
    }

    // dragOffset and dragHandleName may both be undefined -- used for drawing while dragging
    draw(dragOffset, dragHandleName) {
        const type = this.getType()

        let bounds = this.getBounds()
        if (dragHandleName) {
            bounds = itemMap.copyRectWithHandleDelta(bounds, dragHandleName, dragOffset, type === "line")
        } else if (dragOffset) {
            bounds = itemMap.copyRectWithDelta(bounds, dragOffset)
        }

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
                onpointerdown: event => itemMap.mouseDownInItem(this, event)
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
                onpointerdown: event => itemMap.mouseDownInItem(this, event)
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
                onpointerdown: event => itemMap.mouseDownInItem(this, event) 
            })
        } else if (type === "polylines") {
            const segments = this.getExtraData() || [[]]
            return m("g", {
                transform: "translate(" + bounds.x1 + "," + bounds.y1 + ")",
                key: this.uuid,
                onpointerdown: event => itemMap.mouseDownInItem(this, event)
            }, drawPolylines(segments, {
                stroke: this.getStroke(),
                "stroke-width": this.getStrokeWidth(), 
                fill: this.getFill()
            }))
        } else if (type === "text") {
            return m("text", {
                key: this.uuid,
                x: bounds.x1,
                // TODO: Fix the baseline
                y: bounds.y1,
                // Set a minimum size for the rectangle for now
                width: Math.max(10, bounds.x2 - bounds.x1),
                height: Math.max(10, bounds.y2 - bounds.y1),
                style: "user-select: none",
                // "inline-size": "250px",
                onpointerdown: event => itemMap.mouseDownInItem(this, event) 
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
        p.addTriple(this.uuid, { item: item.uuid }, item.uuid)
    }

    deleteItem(item) {
        p.addTriple(this.uuid, { item: item.uuid }, null)
    }

    getExtent() {
        let extent = JSON.parse(p.findC(this.uuid, "extent") || "{}")
        if (!extent.width || !extent.height) {
            extent = { width: 600, height: 200 }
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
    // TODO: change how app works so place new items when click
    return { x1: 0, y1: 0, x2: 50, y2: 50 }
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

function addFreehandScribble() {
    const scribble = itemMap.toggleFreehandScribble()
    if (scribble && scribble.bounds) {
        p.newTransaction("sketcher/addPolylines")
        const item = new Item()
        item.setType("polylines")
        item.setStrokeWidth("3")
        item.setStroke("#000000")
        item.setFill("none")
        item.setBounds(scribble.bounds)
        item.setExtraData(scribble.scribbleSegments)
        sketch.addItem(item)
        p.sendCurrentTransaction()
    }
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
            extraData: item.getExtraData()
        }, null, 4)
    }

    // const svgSketch = document.getElementsByClassName("sketch")[0]
    // console.log("svgSketch", svgSketch)
    const items = sketch.getItems().reverse()
    const texts = items.map(item => "==== " + item.uuid + " ====\n" + textForItem(item))
    console.log("texts", texts.join("\n\n"))
    alert("Exported text to console")
}

// From: https://stackoverflow.com/questions/31593297/using-execcommand-javascript-to-copy-hidden-text-to-clipboard#
function setClipboard(value) {
    var tempInput = document.createElement("input")
    tempInput.style = "position: absolute; left: -1000px; top: -1000px"
    tempInput.value = value
    document.body.appendChild(tempInput)
    tempInput.select()
    document.execCommand("copy")
    document.body.removeChild(tempInput)
}

function copySVG() {
    const selectedItems = itemMap.getSelectedItems()
    if (selectedItems.length === 0) return alert("nothing selected")
    const boundsForSelected = itemMap.calculateBoundsForItems(selectedItems)
    const deltaForExport = { x: -boundsForSelected.x1, y: -boundsForSelected.y1 }
    const itemContent = itemMap.drawItems(selectedItems, deltaForExport)
    const temporaryNode = document.createElement("svg")
    temporaryNode.setAttribute("width", Math.ceil(boundsForSelected.x2 - boundsForSelected.x1))
    temporaryNode.setAttribute("height", Math.ceil(boundsForSelected.y2 - boundsForSelected.y1))
    m.render(temporaryNode, itemContent)
    const svgAsText = temporaryNode.outerHTML
    // console.log(svgAsText)
    setClipboard(svgAsText)
}

function displaySelectedItemProperties() {
    // TODO: Add support for changing all selections at once
    const selectedItems = itemMap.getSelectedItems()
    const item = selectedItems.length ? selectedItems[selectedItems.length - 1] : null
    if (!item) return m("div.mt2.relative", [
        itemMap.getIsScribbling() ? m("span.absolute.pl2", "Scribbling...") : [],
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
        // m("span.tr.w5.dib", type),
        // m("br"),
        m("span.tr.w5.dib", "Fill"), m("input.ml1", { value: item.getFill(), onchange: (event) => item.setFill(event.target.value) }),
        m("br"),
        m("span.tr.w5.dib", "Stroke"), m("input.ml1", { value: item.getStroke(), onchange: (event) => item.setStroke(event.target.value) }),
        m("br"),
        m("span.tr.w5.dib", "Stroke width"), m("input.ml1", { value: item.getStrokeWidth(), onchange: (event) => item.setStrokeWidth(event.target.value) }),
        (type === "line") ? [
            m("br"),
            m("span.tr.w5.dib", "Arrows"), m("select.ml1", { value: arrows, onchange: (event) => item.setArrows(event.target.value) }, [
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
        m("button", { onclick: addRectangle }, "Rectangle"),
        m("button.ml1", { onclick: addCircle }, "Circle"),
        m("button.ml1", { onclick: addText }, "Text"),
        m("button.ml1", { onclick: addLine }, "Line"),
        m("button.ml1.w4" + (itemMap.getIsScribbling() ? ".bg-light-blue" : ""), 
            { onclick: addFreehandScribble }, 
            itemMap.getIsScribbling() ? "<Finish>": "Freehand"
        ),
        m("button.ml3", { onclick: raiseItem }, "Raise"),
        m("button.ml1", { onclick: lowerItem }, "Lower"),
        m("button.ml3", { onclick: deleteItem }, "Delete"),
        m("button.ml3", { onclick: exportSketchText }, "Export Text"),
        m("button.ml3", { onclick: copySVG, title: "Copy selected SVG into clipboard"}, "Copy SVG"),
    ])
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
                    onpointerdown: itemMap.mouseDownInSketch,
                    onpointermove: itemMap.sketchMouseMove,
                    onpointerup: (event) => itemMap.sketchMouseUp(() => sketch.getItems(), event),
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
                m("defs", itemMap.svgMarkers()),
                m("rect", {
                    width: extent.width,
                    height: extent.height,
                    style: { fill: "none", stroke: itemMap.getIsScribbling() ? "#33FFFF" : "#006600" } 
                }),
                itemMap.drawItems(sketch.getItems())
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
