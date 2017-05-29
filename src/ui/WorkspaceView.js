define(["FileUtils", "EvalUtils", "JournalUsingMemory", "JournalUsingLocalStorage", "ace/ace", "ace/ext/modelist", "exampleJournal"], function(
    FileUtils,
    EvalUtils,
    JournalUsingMemory,
    JournalUsingLocalStorage,
    ace,
    modelist,
    exampleJournal
) {
    "use strict"
    /* global m, location, localStorage */

    // let currentJournal = JournalUsingLocalStorage
    let currentJournal = JournalUsingLocalStorage

    // Used for resizing the editor's height
    let dragOriginY
    
    // Convenience function which examples could use to put up closeable views
    function show(viewFunction, config) {
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
                const isCloseButtonShown = location.hash.startsWith("#open=")
                return m("div.ba.ma3.pa3.bg-light-purple.relative" + config.extraStyling,
                    subview,
                    isCloseButtonShown ?
                        [] :
                        m("button.absolute.right-1.top-1", {
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
                        }, "X")
                )
            }
        }

        document.body.appendChild(div)
        m.mount(div, ClosableComponent)
    }
    
    function setupTwirlip7Global() {
        // setup Twirlip7 global for use by evaluated code
        if (!window.Twirlip7) {
            window.Twirlip7 = {}
            if (!window.Twirlip7.show) window.Twirlip7.show = show
            if (!window.Twirlip7.WorkspaceView) window.Twirlip7.WorkspaceView = WorkspaceView
            if (!window.Twirlip7.FileUtils) window.Twirlip7.FileUtils = FileUtils
            if (!window.Twirlip7.JournalUsingLocalStorage) window.Twirlip7.JournalUsingLocalStorage = JournalUsingLocalStorage
            if (!window.Twirlip7.JournalUsingMemory) window.Twirlip7.JournalUsingMemory = JournalUsingMemory
            if (!window.Twirlip7.getCurrentJournal) {
                window.Twirlip7.getCurrentJournal = () => {
                    return currentJournal
                }
            }
        }
    }

    const WorkspaceView = {
        editor: null,
        lastLoadedContents: "",
        currentItemIndex: null,
        journalChoice: "local storage",
        aceEditorHeight: 20,
        toastMessages: [],
        editorMode: "ace/mode/javascript",
        wasEditorDirty: false,
        
        // to support user-defined extensions
        extensions: {},
        
        oninit() {
            if (currentJournal.itemCount() === 0) {
                show(function () { 
                    return [
                        m("div", "Thanks for trying Twirlip7, an experimental Mithril.js playground -- with aspirations towards becoming a distributed social semantic desktop."),
                        m("div", "To get started with some example code snippets, click \"Show example journal\", then \"Merge journal\", then \"Next\", and then \"Do it\"."),
                        m("div", "Use \"Previous\" and \"Next\" to scroll through more example snippets. \"Inspect it\" puts evaluation results for selected text into the console log.")
                    ]
                })
            }
        },
        
        saveCurrentItemIndex() {
            localStorage.setItem("_current_" + WorkspaceView.journalChoice, WorkspaceView.currentItemIndex)
        },
        
        restoreCurrentItemIndex() {
            WorkspaceView.currentItemIndex = localStorage.getItem("_current_" + WorkspaceView.journalChoice)
            if (WorkspaceView.currentItemIndex === null) {
                WorkspaceView.setEditorContents("")
            } else {
                let text = currentJournal.getItem(WorkspaceView.currentItemIndex)
                if (text === null || text === undefined) {
                    WorkspaceView.currentItemIndex = null
                    WorkspaceView.saveCurrentItemIndex()
                    text = ""
                }
                WorkspaceView.setEditorContents(text)
            }
        },

        changeJournal() {
            const oldChoice = WorkspaceView.journalChoice
            const newChoice = (WorkspaceView.journalChoice === "memory" ? "local storage": "memory")

            WorkspaceView.saveCurrentItemIndex()
            WorkspaceView.journalChoice = newChoice
            currentJournal = (newChoice === "memory" ? JournalUsingMemory : JournalUsingLocalStorage)
            WorkspaceView.restoreCurrentItemIndex()
        },

        setEditorContents(newContents, isNotSaved) {
            WorkspaceView.editor.setValue(newContents)
            WorkspaceView.wasEditorDirty = false
            if (!isNotSaved) { 
                WorkspaceView.lastLoadedContents = newContents
            } else {
                WorkspaceView.currentItemIndex = null
                WorkspaceView.saveCurrentItemIndex()
            }
            WorkspaceView.editor.selection.clearSelection()
            WorkspaceView.editor.selection.moveCursorFileStart()
            // Replace undoManager since getUndoManager().reset() does not see to work well enough here
            WorkspaceView.editor.getSession().setUndoManager(new ace.UndoManager())
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
            const addResult = currentJournal.addItem(newContents)
            if (addResult.error) {
                alert("save failed -- maybe too many localStorage items?\n" + addResult.error)
                return
            }
            if (addResult.existed) {
                WorkspaceView.toast("Item already saved", 1000)
            } else {
                WorkspaceView.toast("Saved item as:\n" + addResult.id, 2000)
            }
            WorkspaceView.lastLoadedContents = newContents
            WorkspaceView.currentItemIndex = addResult.id
            WorkspaceView.saveCurrentItemIndex()
        },
        
        isEditorDirty() {
            return WorkspaceView.editor && (WorkspaceView.lastLoadedContents !== WorkspaceView.getEditorContents())
        },

        confirmClear(promptText) {
            if (!WorkspaceView.getEditorContents()) return true
            if (!WorkspaceView.isEditorDirty()) return true
            if (!promptText) promptText = "You have unsaved editor changes. Proceed?"
            return confirm(promptText)
        },

        clear() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.setEditorContents("")
            WorkspaceView.currentItemIndex = null
            WorkspaceView.saveCurrentItemIndex()
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
            const key = currentJournal.skip(WorkspaceView.currentItemIndex, delta, wrap)
            WorkspaceView.goToKey(key)
        },
        
        goToKey(key) {
            // Fist check is to prevent losing redo stack if not moving
            if (key === WorkspaceView.currentItemIndex && !WorkspaceView.isEditorDirty()) return
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.currentItemIndex = key
            const item = currentJournal.getItem(WorkspaceView.currentItemIndex) || ""
            WorkspaceView.setEditorContents(item)
            WorkspaceView.saveCurrentItemIndex()
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

        replaceJournal() {
            if (currentJournal.itemCount() && !confirm("Replace all items with entered text for a journal?")) return
            try {
                currentJournal.loadFromJournalText(WorkspaceView.getEditorContents())
            } catch (error) {
                WorkspaceView.toast("Problem replacing journal from editor:\n" + error)
                return
            }
            WorkspaceView.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedContents = WorkspaceView.getEditorContents()
            WorkspaceView.toast("Replaced journal from editor")
        },
        
        mergeJournal() {
            if (currentJournal.itemCount() && !confirm("Merge existing journal items with entered text for a journal?")) return
            try {
                let addedItemCount = 0
                const newJournalItems = JSON.parse(WorkspaceView.getEditorContents())
                for (let item of newJournalItems) {
                    const addResult = currentJournal.addItem(item)
                    if (!addResult.existed) addedItemCount++
                }
                WorkspaceView.toast("Added " + addedItemCount + " item" + ((addedItemCount === 1 ? "" : "s")) + " to existing journal")
            } catch (error) {
                WorkspaceView.toast("Problem merging journal from editor:\n" + error)
                return
            }
            WorkspaceView.currentItemIndex = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedContents = WorkspaceView.getEditorContents()
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
        
        // Extension sections are intended to be user-defined
        // extension example: {id: "hello", tags: "header", code: (context) => m("div", "Hello from extension") }
        
        extensionsCallForTag(tag, phase) {
            const result = []
            const sortedKeys = Object.keys(WorkspaceView.extensions).sort()
            for (let key of sortedKeys) {
                const extension = WorkspaceView.extensions[key]
                if (!extension) continue
                if (extension.tags && (tag === extension.tags || extension.tags[tag])) {
                    if (extension.code) {
                        const callResult = extension.code({tag, phase, extension})
                        result.push(callResult)
                    } else {
                        console.log("no code for extension", extension.id)
                    }
                }
            }
            return result
        },
        
        extensionsInstall(extension) {
            if (!extension.id) {
                console.log("no id for extension to install\n" + JSON.stringify(extension))
                return
            }
            WorkspaceView.extensions[extension.id] = extension
        },
        
        extensionsUninstall(extension) {
            if (!extension.id) {
                console.log("no id for extension to uninstall\n" + JSON.stringify(extension))
                return
            }
            delete WorkspaceView.extensions[extension.id]
        },
        
        getStartupInfo() {
            // format: { startupItemIds: [ids...] }
            const startupInfo = localStorage.getItem("_startup")
            if (startupInfo) {
                try {
                    const startupInfoParsed = JSON.parse(startupInfo)
                    if (startupInfoParsed.startupItemIds) {
                        return startupInfoParsed
                    }
                } catch (error) {
                    console.log("Problem parsing startup info", error)
                    console.log("Startup infor was", startupInfo)
                    WorkspaceView.setStartupInfo(null)
                }
            }
            return { startupItemIds: [] }
        },
        
        setStartupInfo(info) {
            localStorage.setItem("_startup", JSON.stringify(info))
        },
        
        // View functions which are composed into one big view at the end
        
        viewToast() {
            return m("div#toastDiv.fixed.top-2.left-2.pa2.fieldset.bg-gold.pl3.pr3.tc.o-90.z-max", 
                { hidden: WorkspaceView.toastMessages.length === 0 },
                WorkspaceView.toastMessages.length ? WorkspaceView.toastMessages[0].message : ""
            ) 
        },
        
        viewAbout() {
            return m("div#about", [
                m("a.ml2", { target: "_blank", href: "https://github.com/pdfernhout/Twirlip7" }, "Twirlip7"),
                m("span.ml1", "uses:"),
                m("a.ml1", { target: "_blank", href: "https://mithril.js.org/" }, "Mithril.js"),
                m("a.ml2", { target: "_blank", href: "http://tachyons.io/" }, "Tachyons.js"),
                m("a.ml2", { target: "_blank", href: "https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts" }, "Ace"),
                m("a.ml2", { target: "_blank", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" }, "JavaScript"),
                m("span.ml2", "| Useful:"),
                m("a.ml2", { target: "_blank", href: "https://arthurclemens.github.io/mithril-template-converter" }, "HTML->Mithril"),
            ])
        },
        
        viewNavigate() {
            const undoManager = WorkspaceView.editor && WorkspaceView.editor.getSession().getUndoManager()
            const itemIdentifier = (WorkspaceView.currentItemIndex === null) ? 
                "???" : 
                ("" + WorkspaceView.currentItemIndex).substring(0, 12) + ((("" + WorkspaceView.currentItemIndex).length > 12) ? "..." : "")
            return m("h4.ba.pa1",
                m("button.ma1", { onclick: WorkspaceView.goFirst, title: "Go to first snippet" }, "|<"),
                m("button.ma1", { onclick: WorkspaceView.goPrevious, title: "Go to earlier snippet" }, "< Previous"),
                m("button.ma1", { onclick: WorkspaceView.goNext, title: "Go to later snippet" }, "Next >"),
                m("button.ma1", { onclick: WorkspaceView.goLast, title: "Go to last snippet" }, ">|"),
               "Item ",
                m("span", { title: WorkspaceView.currentItemIndex }, itemIdentifier),
                currentJournal.getCapabilities().idIsPosition ? 
                    "" : 
                    " : " + (currentJournal.locationForKey(WorkspaceView.currentItemIndex) === null ?
                        "???" : 
                        (parseInt(currentJournal.locationForKey(WorkspaceView.currentItemIndex)) + 1)),
                " of ",
                currentJournal.itemCount(),
                WorkspaceView.viewEditorMode(),
                undoManager ? [
                    m("button.ma1", {onclick: () => undoManager.undo(), disabled: !undoManager.hasUndo() }, "< Undo"),
                    m("button.ma1", {onclick: () => undoManager.redo(), disabled: !undoManager.hasRedo() }, "Redo >"),
                ] : [],
                WorkspaceView.viewDirty()
            )
        },
        
        viewEditorMode() {
            function selectChanged(event) {
                const newEditorMode = event.target.value
                WorkspaceView.editorMode = newEditorMode
                WorkspaceView.editor.getSession().setMode(WorkspaceView.editorMode)
            }
            return m("select.ma2", { onchange: selectChanged }, 
                modelist.modes.map(mode => m("option", { value: mode.mode, selected: WorkspaceView.editorMode === mode.mode }, mode.name))
            )
        },
        
        viewDirty() {
            return m("span.dirty", 
                WorkspaceView.isEditorDirty() ?
                   "Modified" :
                   ""
            )
        },
        
        viewFileInput() {
            return m("input#fileInput", { "type" : "file" , "hidden" : true } )
        },
        
        viewEditor() {
            return m("div.w-100#editor", {
                style: {
                    height: WorkspaceView.aceEditorHeight + "rem"
                },
                oncreate: function() {
                    WorkspaceView.editor = ace.edit("editor")
                    WorkspaceView.editor.getSession().setMode(WorkspaceView.editorMode)
                    WorkspaceView.editor.getSession().setUseSoftTabs(true)
                    WorkspaceView.editor.$blockScrolling = Infinity
                    WorkspaceView.editor.getSession().on("change", function(e) {
                        const isEditorDirty = WorkspaceView.isEditorDirty()
                        if (isEditorDirty !== WorkspaceView.wasEditorDirty) {
                            WorkspaceView.wasEditorDirty = isEditorDirty
                            // Use setTimeout to give undo manager some time to update itself
                            setTimeout(m.redraw, 0)
                        }
                    })
                },
                onupdate: function() {
                    WorkspaceView.editor.resize()
                }
            })
        },
        
        viewSplitter() {
            return m("div.bg-light-gray", {
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
            })
        },
        
        viewStartupItem()  {
            const helpText = "Whether to run this snippet when the editor starts up -- snippets run in the order they were added"
            const startupInfo = WorkspaceView.getStartupInfo()
            const isStartupItem = startupInfo.startupItemIds.indexOf(WorkspaceView.currentItemIndex) !== -1
            function toggleUseAtStartup(isStartupItem, itemId) {
                const startupInfo = WorkspaceView.getStartupInfo()
                if (isStartupItem) {
                    const index = startupInfo.startupItemIds.indexOf(itemId)
                    if (index > -1) {
                        startupInfo.startupItemIds.splice(index, 1)
                        WorkspaceView.setStartupInfo(startupInfo)
                    }
                } else {
                    startupInfo.startupItemIds.push(itemId)
                    WorkspaceView.setStartupInfo(startupInfo)
                }
                
            }
            return [
                m("span", {title: helpText}, "Bootstrap it:"), 
                m("input[type=checkbox].ma1", {
                    checked: isStartupItem,
                    disabled: currentJournal !== JournalUsingLocalStorage,
                    onclick: toggleUseAtStartup.bind(null, isStartupItem, WorkspaceView.currentItemIndex),
                    title: helpText
                })
            ]
        },
        
        viewEvaluateButtons() {
            return [
                m("button.ma1", { onclick: WorkspaceView.doIt, title: "Evaluate selected code" }, "Do it"),
                m("button.ma1", { onclick: WorkspaceView.printIt, title: "Evaluate code and insert result in editor" }, "Print it"),
                m("button.ma1", { onclick: WorkspaceView.inspectIt, title: "Evaluate code and log result to console"  }, "Inspect it"),
                m("button.ma1", { onclick: WorkspaceView.openIt, title: "Open current saved snippet in a new window" }, "Open it"),
                WorkspaceView.viewStartupItem()
            ]
        },
                
        viewSpacer() {
            return m("span.pa1")
        },
        
        viewEditorButtons() {
            return [
                m("button.ma1", { onclick: WorkspaceView.save, title: "Save current snippet into the journal"  }, "Save"),
                m("button.ma1", { onclick: WorkspaceView.clear, title: "Clear out text in editor" }, "Clear"),
                m("button.ma1", { onclick: WorkspaceView.importText, title: "Load a file into editor" }, "Import"),
                m("button.ma1", { onclick: WorkspaceView.exportText, title: "Save current editor text to a file" }, "Export"),
            ]
        },
        
        viewBreak() {
            return m("br")
        },
        
        viewJournalButtons() {
            return [
                m("button.ma1", { onclick: WorkspaceView.changeJournal, title: "Change storage location of snippets" }, "Journal: " + WorkspaceView.journalChoice),
                m("button.ma1", { onclick: WorkspaceView.showJournal, title: "Put JSON for journal contents into editor" }, "Show current journal"),
                m("button.ma1", { onclick: WorkspaceView.showExampleJournal, title: "Put a journal of sample snippets as JSON into editor (for loading afterwards)" }, "Show example journal"),
                m("button.ma1", { onclick: WorkspaceView.mergeJournal, title: "Load JSON journal from editor -- merging with the previous snippets" }, "Merge journal"),
                m("button.ma1", { onclick: WorkspaceView.replaceJournal, title: "Load JSON journal from editor -- replacing all previous snippets!" }, "Replace journal"),
            ]
        },
        
        viewExtensionsHeader() {
            return m("#extensionsHeader", WorkspaceView.extensionsCallForTag("header", "view"))
        },
        
        viewExtensionsMiddle() {
            return m("#extensionsMiddle", WorkspaceView.extensionsCallForTag("middle", "view"))
        },
        
        viewExtensionsFooter() {
            return m("#extensionsFooter", WorkspaceView.extensionsCallForTag("footer", "view"))
        },
        
        viewMain() {
            return [
                WorkspaceView.viewToast(),
                WorkspaceView.viewFileInput(),
                WorkspaceView.viewExtensionsHeader(),
                WorkspaceView.viewAbout(),
                WorkspaceView.viewNavigate(),
                WorkspaceView.viewEditor(),
                WorkspaceView.viewSplitter(),
                WorkspaceView.viewExtensionsMiddle(),
                WorkspaceView.viewEvaluateButtons(),
                WorkspaceView.viewSpacer(),
                WorkspaceView.viewEditorButtons(),
                WorkspaceView.viewBreak(),
                WorkspaceView.viewJournalButtons(),
                WorkspaceView.viewExtensionsFooter(),
            ]
        },

        view() {
            return m("#main.ma2", WorkspaceView.viewMain())
        },
    }

    setupTwirlip7Global()
    
    return WorkspaceView
})
