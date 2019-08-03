// Extend the application with common text conversion functions

function convertRemoveNewlines() {
    const selection = Twirlip7.notebookView.getSelectedEditorText().text
    const conversionResult = selection.replace(/(\r\n|\n|\r)/gm," ").replace(/\s+/g," ")
    Twirlip7.notebookView.replaceSelection(conversionResult)
}

function convertUppercase() {
    const selection = Twirlip7.notebookView.getSelectedEditorText().text
    const conversionResult = selection.toUpperCase()
    Twirlip7.notebookView.replaceSelection(conversionResult)
}

function convertLowercase() {
    const selection = Twirlip7.notebookView.getSelectedEditorText().text
    const conversionResult = selection.toLowerCase()
    Twirlip7.notebookView.replaceSelection(conversionResult)
}

Twirlip7.notebookView.extensionsInstall({
    id: "convert-text",
    tags: "middle",
    code: () => {
        return m("div",
            m("button.ma1", {onclick: convertRemoveNewlines}, "Remove newlines"),
            m("button.ma1", {onclick: convertUppercase}, "Uppercase"),
            m("button.ma1", {onclick: convertLowercase}, "Lowercase"),
            m("hr")
        )
    }
})

// Twirlip7.notebookView.extensionsUninstall({id: "convert-text"})
