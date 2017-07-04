// Extend the application with common text conversion functions

function convertRemoveNewlines() {
    const selection = Twirlip7.workspaceView.getSelectedEditorText().text
    const conversionResult = selection.replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," ")
    Twirlip7.workspaceView.replaceSelection(conversionResult)
}

function convertUppercase() {
    const selection = Twirlip7.workspaceView.getSelectedEditorText().text
    const conversionResult = selection.toUpperCase()
    Twirlip7.workspaceView.replaceSelection(conversionResult)
}

function convertLowercase() {
    const selection = Twirlip7.workspaceView.getSelectedEditorText().text
    const conversionResult = selection.toLowerCase()
    Twirlip7.workspaceView.replaceSelection(conversionResult)
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
