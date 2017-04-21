define(["FileUtils", "SelectionUtils", "EvalUtils"], function(FileUtils, SelectionUtils, EvalUtils) {
    "use strict"

    const Archive = {
        items: [],
    }

    const Workspace = {
        editorContents: "",
        lastLoadedContents: "",
        currentItemIndex: null,

        setEditorContents(newContents) {
            Workspace.editorContents = newContents
            Workspace.lastLoadedContents = newContents
        },

        save: function() {
            Archive.items.push(Workspace.editorContents)
            Workspace.currentItemIndex = Archive.items.length - 1
        },

        confirmClear: function(promptText) {
            if (!Workspace.editorContents) return true
            if (Workspace.editorContents === Workspace.lastLoadedContents) return true
            if (!promptText) promptText = "You have unsaved editor changes; proceed?"
            return confirm(promptText)
        },

        clear: function() {
            if (!Workspace.confirmClear()) return
            Workspace.setEditorContents("")
            Workspace.currentItemIndex = null
        },

        doIt: function () {
            const selection = SelectionUtils.getSelection("editor", true)
            try {
                EvalUtils.eval(selection.text)
            } catch (error) {
                alert("Eval error:\n" + error)
            }
        },

        printIt: function () {
            const selection = SelectionUtils.getSelection("editor", true)
            const contents = Workspace.editorContents
            const evalResult = "" + EvalUtils.evalOrError(selection.text)
            Workspace.editorContents = contents.substring(0, selection.end) + evalResult + contents.substring(selection.end)
            setTimeout(() => SelectionUtils.selectRange("editor", selection.end, selection.end + evalResult.length), 0)
        },

        inspectIt: function () {
            const selection = SelectionUtils.getSelection("editor", true)
            const evalResult = EvalUtils.evalOrError(selection.text)
            console.dir(evalResult)
        },

        importText: function() {
            if (!Workspace.confirmClear()) return
            FileUtils.loadFromFile((fileName, fileContents) => {
                if (fileContents) {
                    console.log("updating editor")
                    const newContent = fileName + "\n---------------------------------------\n" + fileContents
                    Workspace.setEditorContents(newContent)
                    m.redraw()
                }
            })
        },

        exportText: function() {
            const fileContents = Workspace.editorContents
            const provisionalFileName = fileContents.split("\n")[0]
            FileUtils.saveToFile(provisionalFileName, fileContents)
        },

        skip: function (offset) {
            if (!Archive.items.length) return
            if (Workspace.currentItemIndex === null) {
                offset >= 0 ? Workspace.currentItemIndex = 0 : Workspace.currentItemIndex = Archive.items.length
            } else {
                Workspace.currentItemIndex = (Archive.items.length + Workspace.currentItemIndex + offset) % Archive.items.length
            }
            Workspace.setEditorContents(Archive.items[Workspace.currentItemIndex])
        },

        previous: function () { Workspace.skip(-1) },

        next: function () { Workspace.skip(1) },

        textForLog: function() {
            return JSON.stringify(Archive.items, null, 4)
        },

        showLog: function () {
            console.log("items", Archive.items)
            if (!Workspace.confirmClear()) return
            Workspace.setEditorContents(Workspace.textForLog()) 
        },

        loadLog: function () {
            if (Archive.items.length && !confirm("Replace all items with entered text for a log?")) return
            Archive.items = JSON.parse(Workspace.editorContents)
            Workspace.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            Workspace.lastLoadedContents = Workspace.editorContents
        },

        view: function() {
            return m("main.ma2", [
                m("h4.bw24.b--solid.b--blue", 
                    "Current item " + 
                    (Workspace.currentItemIndex === null ? "???" : Workspace.currentItemIndex + 1) +
                    " of " + Archive.items.length
                ),
                m("input#fileInput", { "type" : "file" , "hidden" : true } ),
                m("textarea.w-90-ns.h5-ns#editor", { value: Workspace.editorContents, oninput: function (event) { Workspace.editorContents = event.target.value; Workspace.currentItemIndex = null } }),
                m("br"),
                m("button.ma1", { onclick: Workspace.save }, "Save"),
                m("button.ma1", { onclick: Workspace.clear }, "Clear"),
                m("button.ma1", { onclick: Workspace.importText }, "Import"),
                m("button.ma1", { onclick: Workspace.exportText }, "Export"),
                m("br"),
                m("button.ma1", { onclick: Workspace.doIt }, "Do it"),
                m("button.ma1", { onclick: Workspace.printIt }, "Print it"),
                m("button.ma1", { onclick: Workspace.inspectIt }, "Inspect it"),
                m("br"),
                m("button.ma1", { onclick: Workspace.previous }, "Previous"),
                m("button.ma1", { onclick: Workspace.next }, "Next"),
                m("br"),
                m("button.ma1", { onclick: Workspace.showLog }, "Show log"),
                m("button.ma1", { onclick: Workspace.loadLog }, "Load log")
            ])
        }
    }

    return Workspace
})