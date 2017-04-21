define(["vendor/mithril", "Filer"], function(mIgnore, Filer) {
    "use strict";

    const root = document.body

    function getSelection(id, returnAllForNoSelection) {
        const textArea = document.getElementById(id)
        const start = textArea.selectionStart
        const end = textArea.selectionEnd
        const text = textArea.value.substring(start, end)
        if (returnAllForNoSelection) {
            if (start === end) {
                return {
                    start: 0,
                    end: textArea.value.length,
                    text: textArea.value
                }
            }
        }
        return {
            start,
            end,
            text
        }
    }

    function selectRange(id, start, end) {
        const textArea = document.getElementById(id)
        textArea.focus()
        textArea.selectionStart = start
        textArea.selectionEnd = end
    }

    function evalOrError(text) {
        let result;
        try {
            result = eval(text)
        } catch (error) {
            result = error;                
        }
        return result;
    }

    const Archive = {
        editorContents: "",
        lastLoadedContents: "",
        items: [],
        currentItemIndex: null,

        setEditorContents(newContents) {
            Archive.editorContents = newContents
            Archive.lastLoadedContents = newContents
        },

        save: function() {
            Archive.items.push(Archive.editorContents)
            Archive.currentItemIndex = Archive.items.length - 1;
        },

        confirmClear: function(promptText) {
            if (!Archive.editorContents) return true
            if (Archive.editorContents === Archive.lastLoadedContents) return true;
            if (!promptText) promptText = "You have unsaved editor changes; proceed?"
            return confirm(promptText)
        },

        clear: function() {
            if (!Archive.confirmClear()) return
            Archive.setEditorContents("")
            Archive.currentItemIndex = null
        },

        doIt: function () {
            const selection = getSelection("editor", true)
            try {
                eval(selection.text)
            } catch (error) {
                alert("Eval error:\n" + error)
            }
        },

        printIt: function () {
            const selection = getSelection("editor", true)
            const contents = Archive.editorContents
            const evalResult = "" + evalOrError(selection.text)
            Archive.editorContents = contents.substring(0, selection.end) + evalResult + contents.substring(selection.end)
            setTimeout(() => selectRange("editor", selection.end, selection.end + evalResult.length), 0)
        },

        inspectIt: function () {
            const selection = getSelection("editor", true)
            const evalResult = evalOrError(selection.text)
            console.dir(evalResult)
        },

        importText: function() {
            if (!Archive.confirmClear()) return
            Filer.loadFromFile((fileName, fileContents) => {
                if (fileContents) {
                    console.log("updating editor")
                    const newContent = fileName + "\n---------------------------------------\n" + fileContents;
                    Archive.setEditorContents(newContent)
                    m.redraw()
                }
            })
        },

        exportText: function() {
            const fileContents = Archive.editorContents
            const provisionalFileName = fileContents.split("\n")[0]
            Filer.saveToFile(provisionalFileName, fileContents)
        },

        skip: function (offset) {
            if (!Archive.items.length) return
            if (Archive.currentItemIndex === null) {
                offset >= 0 ? Archive.currentItemIndex = 0 : Archive.currentItemIndex = Archive.items.length;
            } else {
                Archive.currentItemIndex = (Archive.items.length + Archive.currentItemIndex + offset) % Archive.items.length
            }
            Archive.setEditorContents(Archive.items[Archive.currentItemIndex])
        },

        previous: function () { Archive.skip(-1) },

        next: function () { Archive.skip(1) },

        textForLog: function() {
            return JSON.stringify(Archive.items, null, 4)
        },

        showLog: function () {
            console.log("items", Archive.items)
            if (!Archive.confirmClear()) return
            Archive.setEditorContents(Archive.textForLog()) 
        },

        loadLog: function () {
            if (Archive.items.length && !confirm("Replace all items with entered text for a log?")) return
            Archive.items = JSON.parse(Archive.editorContents)
            Archive.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            Archive.lastLoadedContents = Archive.editorContents
        },

        view: function() {
            return m("main.ma2", [
                m("h4.bw24.b--solid.b--blue", 
                    "Current item " + 
                    (Archive.currentItemIndex === null ? "???" : Archive.currentItemIndex + 1) +
                    " of " + Archive.items.length
                ),
                m("input#fileInput", { "type" : "file" , "hidden" : true } ),
                m("textarea.w-90-ns.h5-ns#editor", { value: Archive.editorContents, oninput: function (event) { Archive.editorContents = event.target.value; Archive.currentItemIndex = null } }),
                m("br"),
                m("button.ma1", { onclick: Archive.save }, "Save"),
                m("button.ma1", { onclick: Archive.clear }, "Clear"),
                m("button.ma1", { onclick: Archive.importText }, "Import"),
                m("button.ma1", { onclick: Archive.exportText }, "Export"),
                m("br"),
                m("button.ma1", { onclick: Archive.doIt }, "Do it"),
                m("button.ma1", { onclick: Archive.printIt }, "Print it"),
                m("button.ma1", { onclick: Archive.inspectIt }, "Inspect it"),
                m("br"),
                m("button.ma1", { onclick: Archive.previous }, "Previous"),
                m("button.ma1", { onclick: Archive.next }, "Next"),
                m("br"),
                m("button.ma1", { onclick: Archive.showLog }, "Show log"),
                m("button.ma1", { onclick: Archive.loadLog }, "Load log")
            ])
        }
    }

    m.mount(root, Archive)
})