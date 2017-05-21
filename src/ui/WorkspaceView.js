define(["FileUtils", "EvalUtils", "JournalUsingMemory", "JournalUsingLocalStorage", "ace/ace", "exampleJournal"], function(
    FileUtils,
    EvalUtils,
    JournalUsingMemory,
    JournalUsingLocalStorage,
    ace,
    exampleJournal
) {
    "use strict"
    /* global m, location */

    // let currentJournal = JournalUsingLocalStorage
    let currentJournal = JournalUsingLocalStorage

    // Used for resizing the editor's height
    let dragOriginY
    
    // Convenience function which examples could use to put up closeable views
    window.show = function(viewFunction, config) {
        // config supports extraStyling and onclose
        if (typeof config === "string") {
            config = { extraStyling: config }
        }
        if (!config) config = {}
        if (!config.extraStyling) { config.extraStyling = "" }
        
        let div = document.createElement("div")

        const ClosableComponent = {            
            view() {
                let subview
                try {
                    subview = viewFunction()
                } catch (e) {
                    console.log("Error in show function", e)
                    subview = m("div.ba.ma2.pa2.bg-red", "Error in show function: " + e)
                }
                const isShown = location.hash.startsWith("#open=")
                return m("div.ba.ma3.pa3.bg-light-purple" + config.extraStyling,
                    isShown ?
                        [] :
                        m("button.fr", {
                            onclick: function () {
                                if (config.onclose) {
                                    try {
                                        config.onclose()
                                    } catch (e) {
                                        console.log("Error in onclose function", e)
                                    }
                                }
                                m.mount(div, null)
                                document.body.removeChild(div)
                            }
                        }, "X"),
                    subview
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
        journalChoice: "local storage",
        savedItemIndexes: {
            "local storage": null,
            "memory": null,
        },
        aceEditorHeight: 20,
        toastMessages: [],
        
        oninit() {
            if (currentJournal.itemCount() === 0) {
                window.show(function () { 
                    return m("div", `To get started with some example code snippets,
                        click "Show example journal", then "Load journal", then "Next", and then "Do it".
                        Use "Previous" and "Next" to scroll through more example snippets.`)
                })
            }
        },

        changeJournal() {
            const oldChoice = WorkspaceView.journalChoice
            const newChoice = (WorkspaceView.journalChoice === "memory" ? "local storage": "memory")

            WorkspaceView.savedItemIndexes[oldChoice] = WorkspaceView.currentItemIndex
            WorkspaceView.journalChoice = newChoice
            currentJournal = (newChoice === "memory" ? JournalUsingMemory : JournalUsingLocalStorage)
            WorkspaceView.currentItemIndex = WorkspaceView.savedItemIndexes[newChoice]
            if (WorkspaceView.currentItemIndex === null) {
                WorkspaceView.setEditorContents("")
            } else {
                WorkspaceView.setEditorContents(currentJournal.getItem(WorkspaceView.currentItemIndex))
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
            const reference = currentJournal.addItem(newContents)
            if (reference === null) {
                alert("save failed -- maybe too many localStorage items?")
                return
            }
            WorkspaceView.lastLoadedContents = newContents
            WorkspaceView.currentItemIndex = reference
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

        openIt() {
            if (currentJournal !== JournalUsingLocalStorage) {
                alert("Snippets need to be in the local storage journal (not memory)\nto be opened in a new window.")
                return
            }
            if (WorkspaceView.currentItemIndex === null) {
                alert("To open a snippet in its own window, you need to\nnavigate to a snippet from local storage first or save a new one.")
                return
            }
            window.open("#open=" + WorkspaceView.currentItemIndex)
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

        skip(delta, wrap) {
            if (!currentJournal.itemCount()) {
                WorkspaceView.toast("No journal items to display. Try saving one first -- or show the example journal in the editor and then load it.")
                return
            }
            if (currentJournal.itemCount() === 1) {
                WorkspaceView.toast("Only one journal item to display. Try saving another one first.")
                return
            }
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.currentItemIndex = currentJournal.skip(WorkspaceView.currentItemIndex, delta, wrap)
            WorkspaceView.setEditorContents(currentJournal.getItem(WorkspaceView.currentItemIndex))
        },

        goFirst() { WorkspaceView.skip(-1000000) },

        goPrevious() { WorkspaceView.skip(-1) },

        goNext() { WorkspaceView.skip(1) },

        goLast() { WorkspaceView.skip(1000000) },

        showJournal() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.setEditorContents(currentJournal.textForJournal())
            WorkspaceView.currentItemIndex = null
        },

        loadJournal() {
            if (currentJournal.itemCount() && !confirm("Replace all items with entered text for a journal?")) return
            try {
                currentJournal.loadFromJournalText(WorkspaceView.getEditorContents())
            } catch (error) {
                WorkspaceView.toast("Problem loading journal from editor:\n" + error)
                return
            }
            WorkspaceView.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedContents = WorkspaceView.getEditorContents()
            WorkspaceView.toast("Loaded journal from editor")
        },

        showExampleJournal() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.setEditorContents(JSON.stringify(exampleJournal, null, 4))
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
                m("a.ml2", { target: "_blank", href: "https://github.com/pdfernhout/Twirlip7" }, "About Twirlip7"),
                m("span.ml2", "which uses:"),
                m("a.ml2", { target: "_blank", href: "https://mithril.js.org/" }, "Mithril.js"),
                m("a.ml2", { target: "_blank", href: "http://tachyons.io/" }, "Tachyons.js"),
                m("a.ml2", { target: "_blank", href: "https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts" }, "Ace"),
                m("a.ml2", { target: "_blank", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" }, "JavaScript"),
                m("a.ml2", { target: "_blank", href: "https://arthurclemens.github.io/mithril-template-converter" }, "HTML->Mithril"),
                // Useful: 
                m("h4.ba.pa1",
                    m("button.ma1", { onclick: WorkspaceView.goFirst, title: "Go to first snippet" }, "|<"),
                    m("button.ma1", { onclick: WorkspaceView.goPrevious, title: "Go to earlier snippet" }, "< Previous"),
                    m("button.ma1", { onclick: WorkspaceView.goNext, title: "Go to later snippet" }, "Next >"),
                    m("button.ma1", { onclick: WorkspaceView.goLast, title: "Go to last snippet" }, ">|"),
                   "JavaScript snippet ",
                    (WorkspaceView.currentItemIndex === null ? "???" : ("" + WorkspaceView.currentItemIndex).substring(0, 8)),
                    ("" + WorkspaceView.currentItemIndex).length > 8 ? m("span", {title: WorkspaceView.currentItemIndex}, "...") : "",
                    currentJournal.getCapabilities().idIsPosition ? 
                        "" : 
                        " : " + (currentJournal.locationForKey(WorkspaceView.currentItemIndex) === null ?
                            "???" : 
                            (parseInt(currentJournal.locationForKey(WorkspaceView.currentItemIndex)) + 1)),
                    " of ",
                    currentJournal.itemCount()
                ),
                m("input#fileInput", { "type" : "file" , "hidden" : true } ),
                m("div.w-100#editor", {
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
                m("div.bg-light-gray", {
                    // splitter for resizing the editor's height
                    style: { cursor: "ns-resize", height: "0.33rem" },
                    draggable: true,
                    ondragstart: (event) => {
                        dragOriginY = event.screenY
                        event.dataTransfer.setData("Text", event.target.id)
                        event.dataTransfer.effectAllowed = "none"
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
                m("button.ma1", { onclick: WorkspaceView.openIt, title: "Open current saved snippet in a new window" }, "Open it"),
                m("span.pa1"),
                m("button.ma1", { onclick: WorkspaceView.save, title: "Save current snippet into the journal"  }, "Save"),
                m("button.ma1", { onclick: WorkspaceView.clear, title: "Clear out text in editor" }, "Clear"),
                m("button.ma1", { onclick: WorkspaceView.importText, title: "Load a file into editor" }, "Import"),
                m("button.ma1", { onclick: WorkspaceView.exportText, title: "Save current editor text to a file" }, "Export"),
                m("br"),
                m("button", { onclick: WorkspaceView.changeJournal, title: "Change storage location of snippets" }, "Journal: " + WorkspaceView.journalChoice),
                m("button.ma1", { onclick: WorkspaceView.showJournal, title: "Put JSON for journal contents into editor" }, "Show current journal"),
                m("button.ma1", { onclick: WorkspaceView.showExampleJournal, title: "Put a journal of sample snippets as JSON into editor (for loading afterwards)" }, "Show example journal"),
                m("button.ma1", { onclick: WorkspaceView.loadJournal, title: "Load JSON journal from editor -- replacing all previous snippets!" }, "Load journal"),
            ])
        },
    }

    return WorkspaceView
})
