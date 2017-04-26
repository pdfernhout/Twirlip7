define(["FileUtils", "EvalUtils", "MemoryArchive", "LocalStorageArchive", "ace/ace", "exampleLog"], function(
    FileUtils,
    EvalUtils,
    MemoryArchive,
    LocalStorageArchive,
    ace,
    exampleLog
) {
    "use strict"

    let Archive = LocalStorageArchive

    // Used for resizing the editor's height
    let dragOriginY
    
    // Convenience function which examples could use to put up closeable views
    window.show = function(viewFunction, extraStyling) {
        if (!extraStyling) { extraStyling = "" }
        let div = document.createElement("div")

        const ClosableComponent = {
            view() {
                return m("div.ba.ma3.pa3.bg-light-purple" + extraStyling,
                m("button.fr", {onclick: function () { document.body.removeChild(div) } }, "X"),
                viewFunction()
                )
            }
        }

        document.body.appendChild(div)
        m.mount(div, ClosableComponent)
    }

    const WorkspaceView = {
        editor: null,
        lastLoadedContents: "",
        currentItemIndex: null,
        archiveChoice: "local storage",
        savedItemIndexes: {
            "local storage": null,
            "memory": null,
        },
        aceEditorHeight: 20,
        toastMessages: [],
        
        oninit() {
            if (Archive.itemCount() === 0) {
                window.show(function () { 
                    return m("div", `To get started with some example snippets,
                        click "Show example log", then "Load log", then "Next", and then "Do it".
                        Use "Previous" and "Next" to scroll through more example snippets.`)
                })
            }
        },

        changeArchive() {
            const oldChoice = WorkspaceView.archiveChoice
            const newChoice = (WorkspaceView.archiveChoice === "memory" ? "local storage": "memory")

            WorkspaceView.savedItemIndexes[oldChoice] = WorkspaceView.currentItemIndex
            WorkspaceView.archiveChoice = newChoice
            Archive = (newChoice === "memory" ? MemoryArchive : LocalStorageArchive)
            WorkspaceView.currentItemIndex = WorkspaceView.savedItemIndexes[newChoice]
            if (WorkspaceView.currentItemIndex === null) {
                WorkspaceView.setEditorContents("")
            } else {
                WorkspaceView.setEditorContents(Archive.getItem(WorkspaceView.currentItemIndex))
            }
        },

        setEditorContents(newContents, isNotSaved) {
            WorkspaceView.editor.setValue(newContents)
            if (!isNotSaved) { 
                WorkspaceView.lastLoadedContents = newContents
            } else {
                WorkspaceView.currentItemIndex = null
            }
            WorkspaceView.editor.selection.clearSelection()
            WorkspaceView.editor.selection.moveCursorFileStart()
        },

        getEditorContents() {
            return WorkspaceView.editor.getValue()
        },

        getSelectedEditorText() {
            let selectedText = WorkspaceView.editor.session.getTextRange(WorkspaceView.editor.getSelectionRange())
            let isNoSelection = false
            if (!selectedText) {
                // assume user wants all text if nothing is selected
                selectedText = WorkspaceView.editor.getValue()
                isNoSelection = true
            }
            return {
                text: selectedText,
                isNoSelection,
            }
        },

        save() {
            const newContents = WorkspaceView.getEditorContents()
            Archive.addItem(newContents)
            WorkspaceView.lastLoadedContents = newContents
            WorkspaceView.currentItemIndex = Archive.itemCount() - 1
        },

        confirmClear(promptText) {
            if (!WorkspaceView.getEditorContents()) return true
            if (WorkspaceView.getEditorContents() === WorkspaceView.lastLoadedContents) return true
            if (!promptText) promptText = "You have unsaved editor changes. Proceed?"
            return confirm(promptText)
        },

        clear() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.setEditorContents("")
            WorkspaceView.currentItemIndex = null
        },

        doIt() {
            const selection = WorkspaceView.getSelectedEditorText()
            try {
                EvalUtils.eval(selection.text)
            } catch (error) {
                WorkspaceView.toast("Eval error:\n" + error)
            }
        },

        printIt() {
            const selection = WorkspaceView.getSelectedEditorText()
            const evalResult = "" + EvalUtils.evalOrError(selection.text)
            if (selection.isNoSelection) { WorkspaceView.editor.selection.moveCursorFileEnd() }
            const selectedRange = WorkspaceView.editor.selection.getRange()
            const start = selectedRange.end
            const end = WorkspaceView.editor.session.insert(start, evalResult)
            WorkspaceView.editor.selection.setRange({start, end})
            WorkspaceView.editor.focus()
        },

        inspectIt() {
            const selection = WorkspaceView.getSelectedEditorText()
            const evalResult = EvalUtils.evalOrError(selection.text)
            console.dir(evalResult)
        },

        importText() {
            if (!WorkspaceView.confirmClear()) return
            FileUtils.loadFromFile((fileName, fileContents) => {
                if (fileContents) {
                    const newContent = fileName + "\n---------------------------------------\n" + fileContents
                    WorkspaceView.setEditorContents(newContent)
                    m.redraw()
                }
            })
        },

        exportText() {
            const fileContents = WorkspaceView.getEditorContents()
            const provisionalFileName = fileContents.split("\n")[0]
            FileUtils.saveToFile(provisionalFileName, fileContents)
        },

        skip(offset) {
            if (!Archive.itemCount()) {
                WorkspaceView.toast("No log items to display. Try saving one first -- or show the example log in the editor and then load it.")
                return
            }
            if (Archive.itemCount() === 1) {
                WorkspaceView.toast("Only one log item to display. Try saving another one first.")
                return
            }
            if (!WorkspaceView.confirmClear()) return
            if (WorkspaceView.currentItemIndex === null) {
                WorkspaceView.currentItemIndex = (offset >= 0 ?  0 : Archive.itemCount() - 1)
            } else {
                WorkspaceView.currentItemIndex = (Archive.itemCount() + WorkspaceView.currentItemIndex + offset) % Archive.itemCount()
            }
            WorkspaceView.setEditorContents(Archive.getItem(WorkspaceView.currentItemIndex))
        },

        previous() { WorkspaceView.skip(-1) },

        next() { WorkspaceView.skip(1) },

        showLog() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.setEditorContents(Archive.textForLog())
            WorkspaceView.currentItemIndex = null
        },

        loadLog() {
            if (Archive.itemCount() && !confirm("Replace all items with entered text for a log?")) return
            try {
                Archive.loadFromLogText(WorkspaceView.getEditorContents())
            } catch (error) {
                WorkspaceView.toast("Problem loading log from editor:\n" + error)
                return
            }
            WorkspaceView.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedContents = WorkspaceView.getEditorContents()
            WorkspaceView.toast("Loaded log from editor")
        },

        showExampleLog() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.setEditorContents(JSON.stringify(exampleLog, null, 4))
        },

        toast(message, delay) {
            function removeToastAfterDelay() {
                setTimeout(function() {
                    WorkspaceView.toastMessages.shift()
                    if ( WorkspaceView.toastMessages.length ) { removeToastAfterDelay() }
                    m.redraw()
                }, WorkspaceView.toastMessages[0].delay)
            }
            if (delay === undefined) { delay = 3000 }
            WorkspaceView.toastMessages.push({message, delay})
            if ( WorkspaceView.toastMessages.length === 1) { removeToastAfterDelay() }
        },

        view() {
            return m("main.ma2", [
                m("div#toastDiv.fixed.top-2.left-2.w-40.pa2.fieldset.bg-gold.pl3.pr3.tc.o-90.z-max", 
                    { hidden: WorkspaceView.toastMessages.length === 0 },
                    WorkspaceView.toastMessages.length ? WorkspaceView.toastMessages[0].message : ""
                ),
                m("a.ml2", { target: "_blank", href: "https://github.com/pdfernhout/Twirlip7" }, "About Twirlip"),
                m("span.ml2", "which uses:"),
                m("a.ml2", { target: "_blank", href: "https://mithril.js.org/" }, "Mithril.js"),
                m("a.ml2", { target: "_blank", href: "http://tachyons.io/" }, "Tachyons.js"),
                m("a.ml2", { target: "_blank", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" }, "JavaScript"),
                m("h4.ba.pa1", 
                    m("button.ma1", { onclick: WorkspaceView.previous, title: "Go to earlier snippet (or wrap around)" }, "< Previous"),
                    m("button.ma1", { onclick: WorkspaceView.next, title: "Go to later snippet (or wrap around)" }, "Next >"),
                    "JavaScript snippet ",
                    (WorkspaceView.currentItemIndex === null ? "???" : WorkspaceView.currentItemIndex + 1),
                    " of ",
                    Archive.itemCount()
                ),
                m("input#fileInput", { "type" : "file" , "hidden" : true } ),
                m("div.w-90#editor", {
                    style: {
                        height: WorkspaceView.aceEditorHeight + "rem"
                    },
                    oncreate: function() {
                        WorkspaceView.editor = ace.edit("editor")
                        WorkspaceView.editor.getSession().setMode("ace/mode/javascript")
                        WorkspaceView.editor.getSession().setUseSoftTabs(true)
                        WorkspaceView.editor.$blockScrolling = Infinity 
                    },
                    onupdate: function() {
                        WorkspaceView.editor.resize()
                    }
                }),
                m("div.w-90.ba.pa1.bg-light-gray", {
                    // splitter for resizing the editor's height
                    style: { cursor: "grab" },
                    draggable: true,
                    ondragstart: (event) => {
                        dragOriginY = event.screenY
                        event.dataTransfer.setData("Text", event.target.id)
                    },
                    ondragend: (event) => {
                        const yDifference = event.screenY - dragOriginY
                        const lineDifference = Math.floor(yDifference / WorkspaceView.editor.renderer.lineHeight)
                        WorkspaceView.aceEditorHeight = parseInt(WorkspaceView.aceEditorHeight) + lineDifference
                        if (WorkspaceView.aceEditorHeight < 5) { WorkspaceView.aceEditorHeight = 5 }
                        if (WorkspaceView.aceEditorHeight > 100) { WorkspaceView.aceEditorHeight = 100 }
                    },
                }),
                m("button.ma1", { onclick: WorkspaceView.doIt, title: "Evaluate selected code" }, "Do it"),
                m("button.ma1", { onclick: WorkspaceView.printIt, title: "Evaluate code and insert result in editor" }, "Print it"),
                m("button.ma1", { onclick: WorkspaceView.inspectIt, title: "Evaluate code and log result to console"  }, "Inspect it"),
                m("span.pa1"),
                m("button.ma1", { onclick: WorkspaceView.save, title: "Save current snippet into the log"  }, "Save"),
                m("button.ma1", { onclick: WorkspaceView.clear, title: "Clear out text in editor" }, "Clear"),
                m("button.ma1", { onclick: WorkspaceView.importText, title: "Load a file into editor" }, "Import"),
                m("button.ma1", { onclick: WorkspaceView.exportText, title: "Save current editor text to a file" }, "Export"),
                m("br"),
                m("button", { onclick: WorkspaceView.changeArchive, title: "Change storage location of snippets" }, "Archive: " + WorkspaceView.archiveChoice),
                m("button.ma1", { onclick: WorkspaceView.showLog, title: "Put JSON for log contents into editor" }, "Show current log"),
                m("button.ma1", { onclick: WorkspaceView.showExampleLog, title: "Put a log of sample snippets as JSON into editor (for loading afterwards)" }, "Show example log"),
                m("button.ma1", { onclick: WorkspaceView.loadLog, title: "Load JSON log from editor -- replacing all previous snippets!" }, "Load log"),
            ])
        },
    }

    return WorkspaceView
})
