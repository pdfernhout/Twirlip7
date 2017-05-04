// Dragging example works in Firefox but has an offset issue with Chrome

const draggables = { 
    1: {x: 0, y: 0, action: `alert("Hello from draggable #1")`},
    2: {x: 0, y: 0, action: `alert("Hello from draggable #2")`},
    3: {x: 0, y: 0, action: `alert("Hello from draggable #3")`},
    4: {x: 0, y: 0, action: `alert("Hello from draggable #4")`},
    5: {x: 0, y: 0, "name": "In memory of James R. Beniger", action: `open("https://en.wikipedia.org/wiki/Beniger,_James_R.")` },
    6: {x: 0, y: 0, "name": "Log Draggables", action: `console.log("draggables", context.draggables)` },
}

let dragStart

show(() => {
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
                e.dataTransfer.setData('text/plain', number)
                e.dataTransfer.effectAllowed = "move"
            },
            ondragend: (e) => {
                const d = draggables[number]
                console.log("ondragend d", d)
                const s = dragStart;
                console.log("ondragend s", s)
                draggables[number].x = d.x + e.screenX - s.x
                draggables[number].y = d.y + e.screenY - s.y
                console.log("ondragend", draggables[number])
            },
            onclick: draggables[number].action ? function() { const context = { draggables }; eval(draggables[number].action) }: (() => undefined)
        }, draggables[number].name || ("Drag me! " + number)))
      )
    }, ".bg-blue.br4"
)
