// svg example with dragging of one circle
// May not keep up with fast drags

let draggedItem = null;
let dragStart = {}
let objectStart = {}

twirlip7.show(() => {
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
            onmousedown: (event) => {
                draggedItem = event.target
                dragStart = { x: event.clientX, y: event.clientY }
                objectStart = { x: parseInt(event.target.cx.baseVal.value), y: parseInt(event.target.cy.baseVal.value) }
            },
            onmousemove: (event) => {
                console.log("dragging", draggedItem)
                if (draggedItem === event.target) { 
                    const dx = event.clientX - dragStart.x
                    const dy = event.clientY - dragStart.y
                    const newX = objectStart.x + dx
                    const newY = objectStart.y + dy
                    event.target.setAttribute("cx", newX)
                    event.target.setAttribute("cy", newY)
                }
            },
            onmouseup: () => {
                draggedItem = null
                console.log("stop dragging", draggedItem)
            },
        })
    )
}, { onclose: () => clearInterval(interval) })
