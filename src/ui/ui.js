requirejs(["vendor/mithril"], function(mIgnore) {
    const root = document.body

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
        },

        eval: function () {
            Archive.setEditorContents(Archive.editorContents + "\n" + eval(Archive.editorContents))
        },

        importText: function() {
            if (!Archive.confirmClear()) return
            Archive.loadFromFile((fileName, fileContents) => {
                if (fileContents) {
                    console.log("updating editor")
                    const newContent = fileName + "\n---------------------------------------\n" + fileContents;
                    Archive.setEditorContents(newContent)
                    m.redraw()
                }
            })
        },

        loadFromFile: function (callback) {
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
        },

        exportText: function() {
            const fileContents = Archive.editorContents
            const provisionalFileName = fileContents.split("\n")[0]
            Archive.saveToFile(provisionalFileName, fileContents)
        },

        saveToFile: function (provisionalFileName, fileContents) {
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
        },

        skip: function (offset) {
            if (!Archive.items.length) return
            if (Archive.currentItemIndex === null) {
                Archive.currentItemIndex = 0;
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
                m("h3.bw24.b--solid.b--blue", 
                    "Current item " + 
                    (Archive.currentItemIndex === null ? "???" : Archive.currentItemIndex + 1) +
                    " of " + Archive.items.length
                ),
                m("input#fileInput", { "type" : "file" , "hidden" : true } ),
                m("textarea", { value: Archive.editorContents, onchange: function (event) { Archive.editorContents = event.target.value } }),
                m("br"),
                m("button.ma1", { onclick: Archive.save }, "Save"),
                m("button.ma1", { onclick: Archive.clear }, "Clear"),
                m("button.ma1", { onclick: Archive.eval }, "Eval"),
                m("button.ma1", { onclick: Archive.importText }, "Import"),
                m("button.ma1", { onclick: Archive.exportText }, "Export"),
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