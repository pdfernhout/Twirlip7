requirejs(["vendor/mithril"], function(mIgnore) {
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

    class Archive {
        constructor() {
            this.editorContents = "";
            this.lastLoadedContents = "";
            this.items = [];
            this.currentItemIndex = null;
        }

        setEditorContents(newContents) {
            this.editorContents = newContents
            this.lastLoadedContents = newContents
        }

        save() {
            this.items.push(this.editorContents)
            this.currentItemIndex = this.items.length - 1;
        }

        confirmClear(promptText) {
            if (!this.editorContents) return true
            if (this.editorContents === this.lastLoadedContents) return true;
            if (!promptText) promptText = "You have unsaved editor changes; proceed?"
            return confirm(promptText)
        }

        clear() {
            if (!this.confirmClear()) return
            this.setEditorContents("")
            this.currentItemIndex = null
        }

        doIt() {
            const selection = getSelection("editor", true)
            try {
                eval(selection.text)
            } catch (error) {
                alert("Eval error:\n" + error)
            }
        }

        printIt() {
            const selection = getSelection("editor", true)
            const contents = this.editorContents
            const evalResult = "" + evalOrError(selection.text)
            this.editorContents = contents.substring(0, selection.end) + evalResult + contents.substring(selection.end)
            setTimeout(() => selectRange("editor", selection.end, selection.end + evalResult.length), 0)
        }

        inspectIt() {
            const selection = getSelection("editor", true)
            const evalResult = evalOrError(selection.text)
            console.dir(evalResult)
        }

        importText() {
            if (!this.confirmClear()) return
            this.loadFromFile((fileName, fileContents) => {
                if (fileContents) {
                    console.log("updating editor")
                    const newContent = fileName + "\n---------------------------------------\n" + fileContents;
                    this.setEditorContents(newContent)
                    m.redraw()
                }
            })
        }

        loadFromFile(callback) {
            const fileControl = document.getElementById("fileInput");
            fileControl.addEventListener("change", function (event) {
                if (event.target.files.length < 1) return;
                const file = event.target.files[0];
                const reader = new FileReader();
                reader.onload = function(event) {
                    const contents = event.target.result;
                    callback(file.name, contents);
                };
                
                reader.onerror = function(event) {
                    console.error("File could not be read! Code " + event.target.error.code);
                    callback(null, null);
                };
                
                reader.readAsText(file);
            }, false);
            fileControl.click();
        }

        exportText() {
            const fileContents = this.editorContents
            const provisionalFileName = fileContents.split("\n")[0]
            this.saveToFile(provisionalFileName, fileContents)
        }

        saveToFile(provisionalFileName, fileContents) {
            console.log("saveToFile")
            const fileName = prompt("Please enter a file name for saving", provisionalFileName)
            if (!fileName) return
            
            console.log("saving", fileName)
            const downloadLink = document.createElement("a")
            downloadLink.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileContents))
            downloadLink.setAttribute("download", fileName)
            downloadLink.style.display = "none"
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
            console.log("done saving", fileName)
        }

        skip(offset) {
            if (!this.items.length) return
            if (this.currentItemIndex === null) {
                offset >= 0 ? this.currentItemIndex = 0 : this.currentItemIndex = this.items.length;
            } else {
                this.currentItemIndex = (this.items.length + this.currentItemIndex + offset) % this.items.length
            }
            this.setEditorContents(this.items[this.currentItemIndex])
        }

        previous() { this.skip(-1) }

        next() { this.skip(1) }

        textForLog() {
            return JSON.stringify(this.items, null, 4)
        }

        showLog() {
            console.log("items", this.items)
            if (!this.confirmClear()) return
            this.setEditorContents(this.textForLog()) 
        }

        loadLog() {
            if (this.items.length && !confirm("Replace all items with entered text for a log?")) return
            this.items = JSON.parse(this.editorContents)
            this.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            this.lastLoadedContents = this.editorContents
        }

        editorInput(event, other, other2) {
            this.editorContents = event.target.value
            this.currentItemIndex = null
        }
    }

    const ArchiveUI = {
        view(vnode) {
            const archive = vnode.attrs.archive
            console.log("view this & archive", this, archive)

            return m("main.ma2", [
                m("h4.bw24.b--solid.b--blue", 
                    "Current item " + 
                    (archive.currentItemIndex === null ? "???" : archive.currentItemIndex + 1) +
                    " of " + archive.items.length
                ),
                m("input#fileInput", { "type" : "file" , "hidden" : true } ),
                m("textarea.w-90-ns.h5-ns#editor", { value: archive.editorContents, oninput: archive.editorInput.bind(archive) }),
                m("br"),
                m("button.ma1", { onclick: archive.save.bind(archive) }, "Save"),
                m("button.ma1", { onclick: archive.clear.bind(archive) }, "Clear"),
                m("button.ma1", { onclick: archive.importText.bind(archive) }, "Import"),
                m("button.ma1", { onclick: archive.exportText.bind(archive) }, "Export"),
                m("br"),
                m("button.ma1", { onclick: archive.doIt.bind(archive) }, "Do it"),
                m("button.ma1", { onclick: archive.printIt.bind(archive) }, "Print it"),
                m("button.ma1", { onclick: archive.inspectIt.bind(archive) }, "Inspect it"),
                m("br"),
                m("button.ma1", { onclick: archive.previous.bind(archive) }, "Previous"),
                m("button.ma1", { onclick: archive.next.bind(archive) }, "Next"),
                m("br"),
                m("button.ma1", { onclick: archive.showLog.bind(archive) }, "Show log"),
                m("button.ma1", { onclick: archive.loadLog.bind(archive) }, "Load log")
            ])
        }
    }

    const archive = new Archive()

    const Page = {
        view(vnode) {
            return m(ArchiveUI, { archive } )
        }
    }

    m.mount(root, Page)
})