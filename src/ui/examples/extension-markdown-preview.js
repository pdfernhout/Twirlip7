// Extend the application to include a markdown preview
// You can try using this new button on the next snippet which is in markdown.

requirejs(["vendor/marked"], function(marked) {
    function markdownPreview() {
        const markdownString = Twirlip7.notebookView.getEditorContents()
        Twirlip7.show(() => {
            return m("div", m.trust(marked.marked(markdownString)))
        })
    }
    
    Twirlip7.notebookView.extensionsInstall({
        id: "markdown-preview",
        // For tags, try header, middle, and footer
        tags: "footer",
        code: () => {
            return m("button.ma1", {onclick: markdownPreview}, "Show markdown preview")
        }
    })
    
    // We need to redraw because requirejs is asynchronous and Mithril won't know to refresh when it is done
    m.redraw()
})

// Twirlip7.notebookView.extensionsUninstall({id: "markdown-preview"})
