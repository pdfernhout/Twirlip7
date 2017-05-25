// Simple "Done" application

let doneItems = []
let text

function input(event) {
    text = event.target.value
}

function done(event) {
    doneItems.push(text)
    Twirlip7.WorkspaceView.toast("did " + text)
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
