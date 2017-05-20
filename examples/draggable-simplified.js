// simplification of draggables example

const draggable = {
    x: 0,
    y: 0,
    "name": "In memory of James R. Beniger",
    action: () => open("https://en.wikipedia.org/wiki/Beniger,_James_R.") 
}

let dragStart

show(() => {
    return m("div.di.ba.pa2.ma2.relative.bg-green", {
            draggable: true,
            style: {
                cursor: "move",
                top: draggable.y + "px",
                left: draggable.x + "px",
            },
            ondragstart: (event) => {
                dragStart = {x: event.screenX, y: event.screenY}
                event.dataTransfer.setData('text/plain', "Button")
                event.dataTransfer.effectAllowed = "move"
            },
            ondragend: (event) => {
                const s = dragStart;
                draggable.x = draggable.x + event.screenX - dragStart.x
                draggable.y = draggable.y + event.screenY - dragStart.y
            },
            onclick: draggable.action
        }, draggable.name
      )
    }, ".bg-blue.br4"
)
