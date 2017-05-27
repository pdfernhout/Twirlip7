// SVG example with dragging of three circles
// May not keep up with fast drags
// Also issues when drag lower-Z circle over upper-Z circle

let draggedItem = null;
let dragStart = {}
let objectStart = {}

function onmousedownCircle(event) {
    draggedItem = event.target
    dragStart = { x: event.clientX, y: event.clientY }
    objectStart = { x: parseInt(event.target.cx.baseVal.value), y: parseInt(event.target.cy.baseVal.value) }
}

function onmousemoveCircle(event) {
    console.log("dragging", draggedItem)
    if (draggedItem === event.target) { 
        const dx = event.clientX - dragStart.x
        const dy = event.clientY - dragStart.y
        const newX = objectStart.x + dx
        const newY = objectStart.y + dy
        event.target.setAttribute("cx", newX)
        event.target.setAttribute("cy", newY)
    }
}

function onmouseupCircle() {
    draggedItem = null
    console.log("stop dragging", draggedItem)
}

Twirlip7.show(() => {
    return m("svg", { width: 600, height: 200},
        m("rect[height='200'][width='600'][x='0'][y='0']", {
            style: {"stroke": "black", "fill": "none", "stroke-width": "1"}
        }),
        m("circle", {
            cx: 100, 
            cy: 100, 
            r: 50, 
            stroke: "green", 
            "stroke-width": 4, 
            fill: "orange",
            onmousedown: onmousedownCircle,
            onmousemove: onmousemoveCircle,
            onmouseup: onmouseupCircle,
        }),
        m("circle", {
            cx: 200, 
            cy: 100, 
            r: 40, 
            stroke: "blue", 
            "stroke-width": 2, 
            fill: "yellow",
            onmousedown: onmousedownCircle,
            onmousemove: onmousemoveCircle,
            onmouseup: onmouseupCircle,
        }),
        m("circle", {
            cx: 400, 
            cy: 100, 
            r: 60, 
            stroke: "orange", 
            "stroke-width": 7, 
            fill: "green",
            onmousedown: onmousedownCircle,
            onmousemove: onmousemoveCircle,
            onmouseup: onmouseupCircle,
        })
    )
}, { onclose: () => clearInterval(interval) })
