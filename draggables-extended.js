// Dragging example works in Firefox but has an offset issue with Chrome

const draggables = { 
    1: {x: 0, y: 0},
    2: {x: 0, y: 0},
    3: {x: 0, y: 0},
    4: {x: 0, y: 0},
    5: {x: 0, y: 0, "name": "In memory of James R. Beniger", action: `open("https://en.wikipedia.org/wiki/Beniger,_James_R.")` },
    6: {x: 0, y: 0, "name": "Log Draggables", action: `console.log("draggables", this.draggables)` },
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
            // TODO: eval binding needs more work
            onclick: draggables[number].action ? eval.bind({draggables, number}, draggables[number].action) : (() => alert("Hello from draggable #" + number))
        }, draggables[number].name || ("Drag me! " + number)))
      )
    }, ".bg-blue.br4"
)
