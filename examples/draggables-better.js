// HTML dragging example better -- works in Firefox but has an offset issue with Chrome

const draggables = { 
    1: {x: 0, y: 0, action: `alert("Hello from draggable #1")`},
    2: {x: 0, y: 50, action: `alert("Hello from draggable #2")`},
    3: {x: 0, y: 100, action: `alert("Hello from draggable #3")`},
    4: {x: 0, y: 150, name: "Make new item", action: makeNewItem },
    5: {x: 0, y: 200, name: "In memory of James R. Beniger", action: `open("https://en.wikipedia.org/wiki/Beniger,_James_R.")` },
    6: {x: 0, y: 250, name: "Log Draggables", action: `console.log("draggables", context.draggables)` },
}

function makeNewItem(context) {
    console.log("makeNewItem", context)
    const name = prompt("new name?")
    if (!name) return
    context.draggables[new Date().toISOString()] = {x: 0, y: 0, name: name }
}

let dragStart

Twirlip7.show(() => {
    return m("div.bg-gray.h5.w100.relative", { ondragover: (e) => e.preventDefault(), ondrop: (e) => e.preventDefault() },
        Object.keys(draggables).map((number) => m("div.di.ba.pa2.ma2.bg-green.absolute", {
            draggable: true,
            style: {
                cursor: "move",
                top: draggables[number].y + "px",
                left: draggables[number].x + "px",
            },
            ondragstart: (e) => {
                dragStart = {x: e.screenX, y: e.screenY}
                e.dataTransfer.setData("text/plain", number)
                e.dataTransfer.effectAllowed = "move"
            },
            ondragend: (e) => {
                const d = draggables[number]
                const s = dragStart
                draggables[number].x = d.x + e.screenX - s.x
                draggables[number].y = d.y + e.screenY - s.y
            },
            onclick: draggables[number].action ? function() {
                const context = { draggables }
                const action = draggables[number].action
                typeof action === "string" ?
                    eval(draggables[number].action) :
                    action(context)
            }: (() => undefined)
        }, draggables[number].name || ("Drag me! " + number)))
      )
}, ".bg-blue.br4")
