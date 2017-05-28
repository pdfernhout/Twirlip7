// Extend the application to include a markdown preview
// To make this new button go away, you either need to reload the page or use extensionsUninstall

requirejs(["vendor/marked"], function(marked) {
    function markdownPreview() {
        const markdownString = Twirlip7.WorkspaceView.getEditorContents()
        Twirlip7.show(() => {
            return m("div", m.trust(marked(markdownString)))
        })
    }
    
    Twirlip7.WorkspaceView.extensionsInstall({
        id: "markdown-preview",
        // For tags, try header, middle, and footer
        tags: "footer",
        code: (context) => {
            return m("button.ma1", {onclick: markdownPreview}, "Show markdown preview")
        }
    })
})

// Twirlip7.WorkspaceView.extensionsUninstall({id: "markdown-preview"})
