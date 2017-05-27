// SVG example

Twirlip7.show(() => {
    return m("svg", { width: 200, height: 200},
        m("circle", {
            cx: 100, 
            cy: 100, 
            r: 50, 
            stroke: "green", 
            "stroke-width": 4, 
            fill: "orange",
        })
    )
})
