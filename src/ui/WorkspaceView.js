define(["FileUtils", "SelectionUtils", "EvalUtils", "MemoryArchive", "LocalStorageArchive"], function(FileUtils, SelectionUtils, EvalUtils, MemoryArchive, LocalStorageArchive) {
    "use strict"

    let Archive = LocalStorageArchive

    const WorkspaceView = {
        editorContents: "",
        lastLoadedContents: "",
        currentItemIndex: null,
        archiveChoice: "local storage",
        savedItemIndexes: {
            "local storage": null,
            "memory": null,
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

        setEditorContents(newContents) {
            WorkspaceView.editorContents = newContents
            WorkspaceView.lastLoadedContents = newContents
        },

        oninputEditorContents(event) {
            WorkspaceView.editorContents = event.target.value
            WorkspaceView.currentItemIndex = null
        },

        save() {
            Archive.addItem(WorkspaceView.editorContents)
            WorkspaceView.currentItemIndex = Archive.itemCount() - 1
        },

        confirmClear(promptText) {
            if (!WorkspaceView.editorContents) return true
            if (WorkspaceView.editorContents === WorkspaceView.lastLoadedContents) return true
            if (!promptText) promptText = "You have unsaved editor changes; proceed?"
            return confirm(promptText)
        },

        clear() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.setEditorContents("")
            WorkspaceView.currentItemIndex = null
        },

        doIt() {
            const selection = SelectionUtils.getSelection("editor", true)
            try {
                EvalUtils.eval(selection.text)
            } catch (error) {
                alert("Eval error:\n" + error)
            }
        },

        printIt() {
            const selection = SelectionUtils.getSelection("editor", true)
            const contents = WorkspaceView.editorContents
            const evalResult = "" + EvalUtils.evalOrError(selection.text)
            WorkspaceView.editorContents = contents.substring(0, selection.end) + evalResult + contents.substring(selection.end)
            setTimeout(() => SelectionUtils.selectRange("editor", selection.end, selection.end + evalResult.length), 0)
        },

        inspectIt() {
            const selection = SelectionUtils.getSelection("editor", true)
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
            const fileContents = WorkspaceView.editorContents
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
        },

        loadLog() {
            if (Archive.itemCount() && !confirm("Replace all items with entered text for a log?")) return
            Archive.loadFromLogText(WorkspaceView.editorContents)
            WorkspaceView.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedContents = WorkspaceView.editorContents
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
                m("textarea.w-90-ns.h5-ns#editor", { 
                    value: WorkspaceView.editorContents,
                    oninput: WorkspaceView.oninputEditorContents,
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
                m("button.ma1", { onclick: WorkspaceView.loadLog }, "Load log")
            ])
        },
    }

    return WorkspaceView
})