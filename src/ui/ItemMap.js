// ItemMap is a surface for dragging items around on
// and also making freehand scribbles.

// Rounding choices to reduce noise in JSON files...
// const round = value => Math.round(value)
const round = value => Math.round(value * 100) / 100
// const round = value => value

export function drawPolylines(segments, style) {
    return segments.map(sketchSegment => {
        return m("polyline", {
            points: sketchSegment.map(point => "" +  point.x + "," + point.y).join(" "),
            style: style ? style : "fill:none;stroke:black;stroke-width:3" 
        })
    })
}

// Items passed to ItemMap need to have these attributs and methods:
// uuid, getBounds(), setBounds(), getType(), getLayer(), setLayer(), draw()

export function ItemMap() {

    let selectedItems
    let draggedHandle
    let isDragging 
    let dragStart
    let dragDelta
    let wasMouseDownOnItemOrHandle

    let isScribbling = false
    let scribblePoints = null
    let scribbleSegments = []

    function initDragInformation() {
        selectedItems = []
        draggedHandle = null // { item: null, handleName: "x1y1", originalBounds: null }
        isDragging = false
        dragStart = { x: 0, y:0 }
        dragDelta = { x: 0, y:0 }
        wasMouseDownOnItemOrHandle = false
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

    function sketchMouseUp(items, event) {
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

    function toggleFreehandScribble() {
        if (isScribbling) {
            isScribbling = false
            scribblePoints = null
            if (!scribbleSegments.length) return {}
            const newScribbleSegments = scribbleSegments
            scribbleSegments = []
            const bounds = calculateBoundsForScribble(newScribbleSegments)
            adjustPointsForScribble(newScribbleSegments, {x: bounds.x1, y:bounds.y1})
            return {bounds, scribbleSegments: newScribbleSegments}
        } else {
            isScribbling = true
            scribbleSegments = []
            scribblePoints = null
            return null
        }
    }

    function viewItemMap(items, extent) {
        return m("svg.ItemMap", 
            {
                width: extent.width,
                height: extent.height,
                onpointerdown: mouseDownInSketch,
                onpointermove: sketchMouseMove,
                onpointerup: (event) => sketchMouseUp(items, event),
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
            drawItems(items)
        )
    }

    initDragInformation()

    return {
        initDragInformation,
        mouseDownInItem,
        copyRectWithDelta,
        copyRectWithHandleDelta,
        getSelectedItems: () => selectedItems,
        drawItems,
        calculateBoundsForItems,
        deselectAllItems,
        toggleFreehandScribble,
        getIsScribbling: () => isScribbling,
        viewItemMap,
    }

}
