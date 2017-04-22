define(["FileUtils", "SelectionUtils", "EvalUtils"], function(FileUtils, SelectionUtils, EvalUtils) {
    "use strict"

    const Archive = {
        items: [],
    }

    const WorkspaceView = {
        editorContents: "",
        lastLoadedContents: "",
        currentItemIndex: null,

        setEditorContents(newContents) {
            WorkspaceView.editorContents = newContents
            WorkspaceView.lastLoadedContents = newContents
        },

        save() {
            Archive.items.push(WorkspaceView.editorContents)
            WorkspaceView.currentItemIndex = Archive.items.length - 1
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
            if (!Archive.items.length) return
            if (WorkspaceView.currentItemIndex === null) {
                offset >= 0 ? WorkspaceView.currentItemIndex = 0 : WorkspaceView.currentItemIndex = Archive.items.length
            } else {
                WorkspaceView.currentItemIndex = (Archive.items.length + WorkspaceView.currentItemIndex + offset) % Archive.items.length
            }
            WorkspaceView.setEditorContents(Archive.items[WorkspaceView.currentItemIndex])
        },

        previous() { WorkspaceView.skip(-1) },

        next() { WorkspaceView.skip(1) },

        textForLog() {
            return JSON.stringify(Archive.items, null, 4)
        },

        showLog() {
            console.log("items", Archive.items)
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.setEditorContents(WorkspaceView.textForLog()) 
        },

        loadLog() {
            if (Archive.items.length && !confirm("Replace all items with entered text for a log?")) return
            Archive.items = JSON.parse(WorkspaceView.editorContents)
            WorkspaceView.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedContents = WorkspaceView.editorContents
        },

        view() {
            return m("main.ma2", [
                m("h4.bw24.b--solid.b--blue", 
                    "Current item " + 
                    (WorkspaceView.currentItemIndex === null ? "???" : WorkspaceView.currentItemIndex + 1) +
                    " of " + Archive.items.length
                ),
                m("input#fileInput", { "type" : "file" , "hidden" : true } ),
                m("textarea.w-90-ns.h5-ns#editor", { 
                    value: WorkspaceView.editorContents, 
                    oninput: function (event) {
                        WorkspaceView.editorContents = event.target.value
                        WorkspaceView.currentItemIndex = null 
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
                m("button.ma1", { onclick: WorkspaceView.loadLog }, "Load log")
            ])
        }
    }

    return WorkspaceView
})