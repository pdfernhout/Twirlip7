// SVG example with dragging of three circles

let draggedItem = null
let dragStart = {}
let objectStart = {}

function onmousedownCircle(event) {
    draggedItem = event.target
    dragStart = { x: event.clientX, y: event.clientY }
    objectStart = { x: parseInt(event.target.cx.baseVal.value), y: parseInt(event.target.cy.baseVal.value) }
}

function onmousemoveCircle(event) {
    if (draggedItem) {
        const dx = event.clientX - dragStart.x
        const dy = event.clientY - dragStart.y
        const newX = objectStart.x + dx
        const newY = objectStart.y + dy
        draggedItem.setAttribute("cx", newX)
        draggedItem.setAttribute("cy", newY)
    }
}

function onmouseupCircle() {
    draggedItem = null
}

Twirlip7.show(() => {
    return m("svg", {
        width: 600,
        height: 200,
        onmousemove: onmousemoveCircle,
        onmouseup: onmouseupCircle,
    }, [
        m("rect[height='200'][width='600'][x='0'][y='0']", {
            style: { "stroke": "black", "fill": "none", "stroke-width": "1" },
        }),
        m("circle", {
            cx: 100,
            cy: 100,
            r: 50,
            stroke: "green",
            "stroke-width": 4,
            fill: "orange",
            onmousedown: onmousedownCircle,
        }),
        m("circle", {
            cx: 200,
            cy: 100,
            r: 40,
            stroke: "blue",
            "stroke-width": 2,
            fill: "yellow",
            onmousedown: onmousedownCircle,
        }),
        m("circle", {
            cx: 400,
            cy: 100,
            r: 60,
            stroke: "orange",
            "stroke-width": 7,
            fill: "green",
            onmousedown: onmousedownCircle,
        })
    ])
})
