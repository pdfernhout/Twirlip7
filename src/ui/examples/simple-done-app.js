// Simple "Done" application

// There is a splitter bar in the IDE under the editor that you can drag if you want to see more or less editor text at once.

let doneItems = []
let text

function input(event) {
    text = event.target.value
}

function done() {
    doneItems.push(text)
    // Toast will not show up running standalone as it depends on the editor
    Twirlip7.workspaceView.toast("did " + text)
    text = ""
}

Twirlip7.show(() => {
    return m("div", [
        doneItems.map(item => m("div", item)),
        "Did:",
        m("input.ma2", { value: text, oninput: input }),
        m("button.ma2", { onclick: done }, "Done!")
    ])
}, ".bg-blue.br4")
