// HTML dragging example -- works in Firefox but has an offset issue with Chrome

const draggables = { 
    1: {x: 0, y: 0},
    2: {x: 0, y: 0},
    3: {x: 0, y: 0},
    4: {x: 0, y: 0},
}

let dragStart

Twirlip7.show(() => {
    return m("div.bg-gray.h5.w100", { ondragover: (e) => e.preventDefault(), ondrop: (e) => e.preventDefault() },
        Object.keys(draggables).map((number) => m("div.di.ba.pa2.ma2.relative.bg-green", {
            draggable: true,
            style: {
                cursor: "move",
                top: draggables[number].y + "px",
                left: draggables[number].x + "px",
            },
            ondragstart: (e) => {
                dragStart = {x: e.screenX, y: e.screenY}
                console.log("ondragstart", dragStart, e)
                e.dataTransfer.setData("text/plain", number)
                e.dataTransfer.effectAllowed = "move"
            },
            ondragend: (e) => {
                const d = draggables[number]
                console.log("ondragend d", d)
                const s = dragStart
                console.log("ondragend s", s)
                draggables[number] = {x: d.x + e.screenX - s.x, y: d.y + e.screenY - s.y}
                console.log("ondragend", draggables[number])
            },
            onclick: () => alert("Hello from draggable #" + number)
        }, "Drag me! " + number))
    )
}, ".bg-blue.br4")
