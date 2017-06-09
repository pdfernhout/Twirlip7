// SVG example with updating
// Seems to flicker slightly

let x = 100
let y = 100

function update() {
    x += 1
    y -= 0.25
    m.redraw()
}
const interval = setInterval(update, 100)

Twirlip7.show(() => {
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
        })
    )
}, { onclose: () => clearInterval(interval) })
