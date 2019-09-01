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

let selectedItems
let draggedHandle
let isDragging 
let dragStart
let dragDelta
let wasMouseDownOnItemOrHandle

function initDragInformation() {
    selectedItems = []
    draggedHandle = null // { item: null, handleName: "x1y1", originalBounds: null }
    isDragging = false
    dragStart = { x: 0, y:0 }
    dragDelta = { x: 0, y:0 }
    wasMouseDownOnItemOrHandle = false
}

initDragInformation()

let isScribbling = false
let scribblePoints = null
let scribbleSegments = []

let sketchViewportHeight = 500

// Rounding choices to reduce noise in JSON files...
// const round = value => Math.round(value)
const round = value => Math.round(value * 100) / 100
// const round = value => value

function getCurrentSketchUUID() {
    return p.findC("sketcher", "current-sketch")
}

function resetForSketchChange() {
    let currentSketch = getCurrentSketchUUID() || p.uuidv4()
    sketch = new Sketch(currentSketch)
    initDragInformation()
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

function isItemSelected(item) {
    return selectedItems.some(selectedItem => selectedItem.uuid === item.uuid)
}

function deselectAllItems() {
    selectedItems = []
}

function selectItem(item) {
    if (isItemSelected(item)) return
    const index = selectedItems.indexOf(item)
    selectedItems.push(item)
}

function unselectItem(item) {
    const index = selectedItems.findIndex(selectedItem => selectedItem.uuid === item.uuid)
    if (index > -1) {
        selectedItems.splice(index, 1)
    }
}

function copyRectWithDelta(rect, delta) {
    return {
        x1: rect.x1 + delta.x,
        y1: rect.y1 + delta.y,
        x2: rect.x2 + delta.x,
        y2: rect.y2 + delta.y
    }
}

function copyRectWithHandleDelta(rect, handleName, delta, allowNegativeVolume) {
    const bounds = {
        x1: rect.x1,
        y1: rect.y1,
        x2: rect.x2,
        y2: rect.y2
    }
    if (handleName === "x1y1" || handleName === "x1y2") bounds.x1 += delta.x
    if (handleName === "x1y1" || handleName === "x2y1") bounds.y1 += delta.y
    if (handleName === "x2y1" || handleName === "x2y2") bounds.x2 += delta.x
    if (handleName === "x1y2" || handleName === "x2y2") bounds.y2 += delta.y

    // Limit bounds to positive area and ensure x2 is >= x1 and y2 >= y1
    bounds.x1 = Math.max(bounds.x1, 0)
    bounds.y1 = Math.max(bounds.y1, 0)
    bounds.x2 = Math.max(bounds.x2, 0)
    bounds.y2 = Math.max(bounds.y2, 0)

    if (!allowNegativeVolume) {
        switch (handleName) {
        case "x1y1":
            bounds.x1 = Math.min(bounds.x1, bounds.x2)
            bounds.y1 = Math.min(bounds.y1, bounds.y2)
            break
        case "x1y2":
            bounds.x1 = Math.min(bounds.x1, bounds.x2)
            bounds.y2 = Math.max(bounds.y1, bounds.y2)
            break
        case "x2y1":
            bounds.x2 = Math.max(bounds.x1, bounds.x2)
            bounds.y1 = Math.min(bounds.y1, bounds.y2)
            break
        case "x2y2":
            bounds.x2 = Math.max(bounds.x1, bounds.x2)
            bounds.y2 = Math.max(bounds.y1, bounds.y2)
            break
        default:
            console.log("copyRectWithHandleDelta: Unexpected handleName", handleName)
            break
        }
    }

    return bounds
}

function selectOrUnselectItemForEvent(item, event, isGroupSelection) {
    if (event.ctrlKey) {
        if (isItemSelected(item)) {
            unselectItem(item)
        } else {
            // Unselect first to move item to end of selected items
            unselectItem(item)
            selectItem(item)
        }
    } else if (event.shiftKey) {
        unselectItem(item)
        selectItem(item)
    } else {
        if (!isGroupSelection && !isItemSelected(item)) {
            deselectAllItems()
        } else {
            unselectItem(item)
        }
        selectItem(item)
    }
}

function mouseDownInItem(item, event) {
    if (isScribbling) return
    wasMouseDownOnItemOrHandle = true
    isDragging = true
    draggedHandle = null
    selectOrUnselectItemForEvent(item, event, false)
    // Prevent switching into drag-and-drop sometimes
    event.preventDefault()
}

// TODO: Can both a handle and an item get a mouse down for the same event? What happens?

// For a drag handle
function mouseDownInHandle(item, handleName, event) {
    if (isScribbling) return
    // if (selectedItems.length > 1 || !isItemSelected(item)) return
    wasMouseDownOnItemOrHandle = true
    isDragging = true
    draggedHandle = { item, handleName, originalBounds: item.getBounds() }
    // Prevent switching into drag-and-drop sometimes
    event.preventDefault()
}

function mouseDownInSketch(event) {
    // This happens even when an item or handle has a mouse down

    // Reset selection if mouse down outside of any item or handle
    if (!wasMouseDownOnItemOrHandle) {
        if (!event.ctrlKey && !event.shiftKey) deselectAllItems()
        isDragging = true
    }

    dragStart = { x: round(event.offsetX), y: round(event.offsetY) }
    dragDelta = { x: 0, y: 0 }

    if (isScribbling) {
        scribblePoints = [{ x: round(event.offsetX), y: round(event.offsetY) }]
        scribbleSegments.push(scribblePoints)
    }
}

function sketchMouseMove(event) {
    if (isScribbling && scribblePoints) {
        scribblePoints.push({ x: round(event.offsetX), y: round(event.offsetY) })
    } else if (isDragging) {
        const dx = round(event.offsetX) - dragStart.x
        const dy = round(event.offsetY) - dragStart.y
        if (dragDelta.x === dx && dragDelta.y === dy) {
            event.redraw = false
            return
        }
        dragDelta = { x: dx, y: dy }
    } else {
        // Optimization: no need to redraw in Mithril
        event.redraw = false
    }
}

function areRectsIntersecting(rect1, rect2) {
    return (rect1.x1 <= rect2.x2 && rect1.x2 >= rect2.x1 && rect1.y1 <= rect2.y2 && rect1.y2 >= rect2.y1) 
}

function sketchMouseUp(event) {
    if (isScribbling) {
        scribblePoints = null
    } else if (isDragging && dragDelta.x !== 0 && dragDelta.y !== 0) {
        if (draggedHandle) {
            selectedItems.forEach(item => {
                const newBounds = copyRectWithHandleDelta(item.getBounds(), draggedHandle.handleName, dragDelta, item.getType() === "line")
                item.setBounds(newBounds)
            })
        } else if (wasMouseDownOnItemOrHandle) {
            selectedItems.forEach(item => {
                const newBounds = copyRectWithDelta(item.getBounds(), dragDelta)
                item.setBounds(newBounds)
            })
        } else {
            // Group selection
            const items = sketch.getItems()
            const selectionRect = rectForGroupSelection()
            items.forEach(item => {
                const itemBounds = item.getBounds()
                if (areRectsIntersecting(itemBounds, selectionRect)) {
                    selectOrUnselectItemForEvent(item, event, true)
                }
            })
        }
    }
    wasMouseDownOnItemOrHandle = false
    isDragging = false
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
            bounds = copyRectWithHandleDelta(bounds, dragHandleName, dragOffset, type === "line")
        } else if (dragOffset) {
            bounds = copyRectWithDelta(bounds, dragOffset)
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
                onpointerdown: mouseDownInItem.bind(this, this)
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
                onpointerdown: mouseDownInItem.bind(this, this) 
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
                onpointerdown: mouseDownInItem.bind(this, this) 
            })
        } else if (type === "polylines") {
            const segments = this.getExtraData() || [[]]
            return m("g", {
                transform: "translate(" + bounds.x1 + "," + bounds.y1 + ")",
                key: this.uuid,
                onpointerdown: mouseDownInItem.bind(this, this)
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
                onpointerdown: mouseDownInItem.bind(this, this) 
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

function drawPolylines(segments, style) {
    return segments.map(sketchSegment => {
        return m("polyline", {
            points: sketchSegment.map(point => "" +  point.x + "," + point.y).join(" "),
            style: style ? style : "fill:none;stroke:black;stroke-width:3" 
        })
    })
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

function calculateBoundsForScribble(segments) {
    const bounds = { x1: 0, y1: 0, x2: 50, y2: 50 }
    if (segments.length && segments[0].length) {
        const firstPoint = segments[0][0]
        bounds.x1 = firstPoint.x
        bounds.x2 = firstPoint.x
        bounds.y1 = firstPoint.y
        bounds.y2 = firstPoint.y
    }
    for (let segment of segments) {
        for (let point of segment) {
            bounds.x1 = point.x < bounds.x1 ? point.x : bounds.x1
            bounds.x2 = point.x > bounds.x2 ? point.x : bounds.x2
            bounds.y1 = point.y < bounds.y1 ? point.y : bounds.y1
            bounds.y2 = point.y > bounds.y2 ? point.y : bounds.y2
        }
    }
    return bounds
}

function adjustPointsForScribble(segments, offset) {
    for (let segment of segments) {
        for (let point of segment) {
            point.x -= offset.x
            point.y -= offset.y
        }
    }
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
    if (isScribbling) {
        isScribbling = false
        scribblePoints = null
        if (!scribbleSegments.length) return
        p.newTransaction("sketcher/addPolylines")
        const item = new Item()
        item.setType("polylines")
        item.setStrokeWidth("3")
        item.setStroke("#000000")
        item.setFill("none")
        const bounds = calculateBoundsForScribble(scribbleSegments)
        item.setBounds(bounds)
        adjustPointsForScribble(scribbleSegments, {x: bounds.x1, y:bounds.y1})
        item.setExtraData(scribbleSegments)
        scribbleSegments = []
        sketch.addItem(item)
        p.sendCurrentTransaction()
    } else {
        isScribbling = true
        scribbleSegments = []
        scribblePoints = null
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

function rectForGroupSelection() {
    const x = Math.max(0, Math.min(dragStart.x, dragStart.x + dragDelta.x))
    const y = Math.max(0, Math.min(dragStart.y, dragStart.y + dragDelta.y))
    return {
        x1: x,
        y1: y,
        x2: x + Math.abs(dragDelta.x),
        y2: y + Math.abs(dragDelta.y)
    }
}

function drawItems(items, deltaForExport) {
    function compare(a, b) {
        const aLayer = a.getLayer()
        const bLayer = b.getLayer()
        if (aLayer < bLayer) return -1
        if (aLayer > bLayer) return 1
        if (a.uuid < b.uuid) return -1
        if (a.uuid > b.uuid) return 1
        throw new Error("uuids of different items in list should not be the same")
    }

    function drawHandle(item, name, x, y) {
        if (y === undefined) throw new Error("bug")
        return  m("circle", {
            cx: x,
            cy: y,
            r: 5, 
            style: {
                stroke: "#006600",
                fill: "#000000"
            },
            onpointerdown: mouseDownInHandle.bind(null, item, name)
        })
    }

    function drawSelections() {
        return selectedItems.map(item => {
            const itemBounds = item.getBounds()
            const bounds = (isDragging && wasMouseDownOnItemOrHandle)
                ? (draggedHandle 
                    ? copyRectWithHandleDelta(itemBounds, draggedHandle.handleName, dragDelta, item.getType() === "line")
                    : copyRectWithDelta(itemBounds, dragDelta))
                : itemBounds
            const type = item.getType()
            return m("g", [
                drawHandle(item, "x1y1", bounds.x1, bounds.y1),
                (type !== "line") ? drawHandle(item, "x1y2", bounds.x1, bounds.y2) : [],
                (type !== "line") ? drawHandle(item, "x2y1", bounds.x2, bounds.y1) : [],
                drawHandle(item, "x2y2", bounds.x2, bounds.y2),
            ])
        })
    }

    function drawGroupSelection() {
        if (isDragging && !wasMouseDownOnItemOrHandle) {
            const selectionRect = rectForGroupSelection()
            return m("rect", {
                x: selectionRect.x1,
                y: selectionRect.y1,
                width: selectionRect.x2 - selectionRect.x1,
                height: selectionRect.y2 - selectionRect.y1,
                style: { fill: "grey", stroke: "#000000", "fill-opacity": 0.1, "stroke-opacity": 0.5 } 
            })
        }
        return []
    }

    const sortedItems = items.sort(compare)
    const drawnItems = sortedItems.map((item) => {
        const isItemDragged = isDragging && wasMouseDownOnItemOrHandle && (isItemSelected(item) || (draggedHandle && draggedHandle.item.uuid === item.uuid))
        return item.draw(isItemDragged ? dragDelta : deltaForExport, isItemDragged && draggedHandle && draggedHandle.handleName)
    })

    return [
        drawnItems,
        !deltaForExport && drawSelections(),
        !deltaForExport && drawGroupSelection(),
        !deltaForExport && isScribbling ? drawPolylines(scribbleSegments) : []
    ]
}

function raiseItem() {
    selectedItems.forEach(item => item.setLayer(item.getLayer() + 1))
}

function lowerItem() {
    selectedItems.forEach(item => item.setLayer(item.getLayer() - 1))
}

function deleteItem() {
    if (!selectedItems.length) return
    if (!confirm("Delete " + selectedItems.length + " item(s)?")) return
    selectedItems.forEach(item => sketch.deleteItem(item))
    deselectAllItems()
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

function calculateBoundsForItems(items) {
    if (!items.length) return {x1: 0, y1: 0, x2: 0, y2: 0}
    const totalBounds = items[0].getBounds()
    items.forEach(item => {
        const itemBounds = item.getBounds()
        // LInes can be reversed, so need to consider both extents
        totalBounds.x1 = Math.min(totalBounds.x1, itemBounds.x1, itemBounds.x2)
        totalBounds.y1 = Math.min(totalBounds.y1, itemBounds.y1, itemBounds.y2)
        totalBounds.x2 = Math.max(totalBounds.x2, itemBounds.x1, itemBounds.x2)
        totalBounds.y2 = Math.max(totalBounds.y2, itemBounds.y1, itemBounds.y2)
    })
    /* If wanted to have integert bounds
    totalBounds.x1 = Math.floor(totalBounds.x1)
    totalBounds.y1 = Math.floor(totalBounds.y1)
    totalBounds.x2 = Math.ceil(totalBounds.x2)
    totalBounds.y2 = Math.ceil(totalBounds.y2)
    */
    return totalBounds
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
    if (selectedItems.length === 0) return alert("nothing selected")
    const boundsForSelected = calculateBoundsForItems(selectedItems)
    const deltaForExport = { x: -boundsForSelected.x1, y: -boundsForSelected.y1 }
    const itemContent = drawItems(selectedItems, deltaForExport)
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
    const item = selectedItems.length ? selectedItems[selectedItems.length - 1] : null
    if (!item) return m("div.mt2.relative", [
        isScribbling ? m("span.absolute.pl2", "Scribbling...") : [],
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
        m("button.ml1.w4" + (isScribbling ? ".bg-light-blue" : ""), { onclick: addFreehandScribble }, isScribbling ? "<Finish>": "Freehand"),
        m("button.ml3", { onclick: raiseItem }, "Raise"),
        m("button.ml1", { onclick: lowerItem }, "Lower"),
        m("button.ml3", { onclick: deleteItem }, "Delete"),
        m("button.ml3", { onclick: exportSketchText }, "Export Text"),
        m("button.ml3", { onclick: copySVG, title: "Copy selected SVG into clipboard"}, "Copy SVG"),
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
                    onpointerdown: mouseDownInSketch,
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
                    style: { fill: "none", stroke: isScribbling ? "#33FFFF" : "#006600" } 
                }),
                drawItems(sketch.getItems())
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
