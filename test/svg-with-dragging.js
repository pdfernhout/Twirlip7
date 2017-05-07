// svg example with dragging
// Only works as expected on the first drag
// Need to deal with offset better

let x = 100;
let y = 100;

function update() {
    x += 1;
    y -= 0.25;
    m.redraw()
}
const interval = setInterval(update, 100);

let draggedItem = null;
let start = {}
let offset = {}

show(() => {
    return m("svg", { width: 600, height: 200},
        m("rect[height='200'][width='600'][x='0'][y='0']", {
            style: {"stroke": "black", "fill": "none", "stroke-width": "1"}
        }),
        m("circle", {
            cx: x, 
            cy: y, 
            r: 50, 
            stroke: "green", 
            "stroke-width": 4, 
            fill: "orange",
            onmousedown: (event) => {
                draggedItem = event.target
                start = { x: event.clientX, y: event.clientY }
                console.log("start", start)
                offset = { x: 0, y: 0 }
            },
            onmousemove: (event) => { 
                if (draggedItem === event.target) { 
                    let x = event.clientX - start.x + offset.x
                    let y = event.clientY - start.y + offset.y
                    event.target.setAttribute("transform", "translate(" + x + "," + y + ")") 
                } else {
                    draggedItem = null
                }
            },
            onmouseup: () => draggedItem = null,
        })
    )
}, { onclose: () => clearInterval(interval) })
