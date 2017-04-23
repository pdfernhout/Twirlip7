define(["FileUtils", "SelectionUtils", "EvalUtils", "MemoryArchive", "LocalStorageArchive", "ace/ace"], function(
    FileUtils,
    SelectionUtils,
    EvalUtils,
    MemoryArchive,
    LocalStorageArchive,
    ace
) {
    "use strict"

    let Archive = LocalStorageArchive

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
            if (!selectedText) {
                // assume user wants all text if nothing is selected
                selectedText = WorkspaceView.editor.getValue()
            }
            return {
                text: selectedText
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
                alert("Eval error:\n" + error)
            }
        },

        printIt() {
            const selection = WorkspaceView.getSelectedEditorText()
            const evalResult = "" + EvalUtils.evalOrError(selection.text)
            const start = WorkspaceView.editor.selection.getRange().end
            const end = WorkspaceView.editor.session.insert(start, evalResult)
            WorkspaceView.editor.selection.setRange({start, end})
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
                    console.log("updating editor")
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
            if (!Archive.itemCount()) return
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
            Archive.loadFromLogText(WorkspaceView.getEditorContents())
            WorkspaceView.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedContents = WorkspaceView.getEditorContents()
        },

        view() {
            return m("main.ma2", [
                m("button", {onclick: WorkspaceView.changeArchive}, "Archive: " + WorkspaceView.archiveChoice),
                m("h4.bw24.b--solid.b--blue", 
                    "Current item ",
                    (WorkspaceView.currentItemIndex === null ? "???" : WorkspaceView.currentItemIndex + 1),
                    " of ",
                    Archive.itemCount()
                ),
                m("input#fileInput", { "type" : "file" , "hidden" : true } ),
                "Editor height: ",
                m("input.ma1", {
                    value: WorkspaceView.aceEditorHeight,
                    onchange: function(event) {
                        const newValue = event.target.value
                        WorkspaceView.aceEditorHeight = newValue
                        // setTimeout(WorkspaceView.editor.resize.bind(null, true), 0)
                    }
                }),
                m("br"),
                m("div.w-90.ba#editor", {
                    style: {
                        height: WorkspaceView.aceEditorHeight + "rem"
                    },
                    oncreate: function(vnode) {
                        console.log("Initialized with height of: ", vnode.dom.offsetHeight)
                        WorkspaceView.editor = ace.edit("editor")
                        // WorkspaceView.editor.setTheme("ace/theme/monokai")
                        WorkspaceView.editor.getSession().setMode("ace/mode/javascript")
                        WorkspaceView.editor.getSession().setUseSoftTabs(true)
                    },
                    onupdate: function() {
                        WorkspaceView.editor.resize()
                    }
                }),
                m("br"),
                m("button.ma1", { onclick: WorkspaceView.save }, "Save"),
                m("button.ma1", { onclick: WorkspaceView.clear }, "Clear"),
                m("button.ma1", { onclick: WorkspaceView.importText }, "Import"),
                m("button.ma1", { onclick: WorkspaceView.exportText }, "Export"),
                m("br"),
                m("button.ma1", { onclick: WorkspaceView.doIt }, "Do it"),
                m("button.ma1", { onclick: WorkspaceView.printIt }, "Print it"),
                m("button.ma1", { onclick: WorkspaceView.inspectIt }, "Inspect it"),
                m("br"),
                m("button.ma1", { onclick: WorkspaceView.previous }, "Previous"),
                m("button.ma1", { onclick: WorkspaceView.next }, "Next"),
                m("br"),
                m("button.ma1", { onclick: WorkspaceView.showLog }, "Show log"),
                m("button.ma1", { onclick: WorkspaceView.loadLog }, "Load log"),
            ])
        },
    }

    return WorkspaceView
})