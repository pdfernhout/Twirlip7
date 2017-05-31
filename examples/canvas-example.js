// Canvas example

let canvas

// Have an offset so we can see result of pressing draw button multiple times
let drawingOffset = 0

function drawLine() {
    const context = canvas.getContext("2d")
    context.beginPath()
    context.moveTo(50 + drawingOffset, 50)
    context.lineTo(150 + drawingOffset,150)
    context.stroke()
    drawingOffset += 10
}

function drawText() {
    const context = canvas.getContext("2d")
    context.fillText("Hello", 50 + drawingOffset, 50)
    drawingOffset += 40
}

function clear() {
    const context = canvas.getContext("2d")
    context.clearRect(0, 0, canvas.width, canvas.height)
}

function reset() {
    drawingOffset = 0
}

Twirlip7.show(() => {
    return [
        m("canvas.ba", {
            width: 600,
            height: 200,
            oncreate: (vnode) => {
                // Store a reference to the created canvas for later use
                canvas = vnode.dom
            }
        }),
        m("br"),
        m("button.ma1", { onclick: drawLine }, "Draw line"),
        m("button.ma1", { onclick: drawText }, "Draw text"),
        m("button.ma1", { onclick: clear }, "Clear"),
        m("button.ma1", { onclick: reset }, "Reset drawing offset"),
    ]
})
