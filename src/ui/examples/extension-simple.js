// Extend the application
// To make this new button go away, you either need to reload the page or use extensionsUninstall

Twirlip7.notebookView.extensionsInstall({
    id: "test",
    // For tags, try header, middle, and footer
    tags: "header",
    code: () => {
        return m("button.ma1", {onclick: alert.bind(null, "test")}, "Test of changing application!")
    }
})

// Twirlip7.notebookView.extensionsUninstall({id: "test"})
