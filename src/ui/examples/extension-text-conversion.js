// Extend the application with common text conversion functions

function convertRemoveNewlines() {
    // TODO: const selection = Twirlip7.workspaceview.
    alert("unfinished")
}

function convertUppercase() {
    alert("unfinished")
}

function convertLowercase() {
    alert("unfinished")
}

Twirlip7.workspaceView.extensionsInstall({
    id: "convert-text",
    tags: "middle",
    code: (context) => {
        return m("div",
            m("button.ma1", {onclick: convertRemoveNewlines}, "Remove newlines"),
            m("button.ma1", {onclick: convertUppercase}, "Uppercase"),
            m("button.ma1", {onclick: convertLowercase}, "Lowercase"),
            m("hr")
        )
    }
})

// Twirlip7.workspaceView.extensionsUninstall({id: "convert-text"})
