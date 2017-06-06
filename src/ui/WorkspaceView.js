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

    // Convenience function which examples could use to put up closeable views
    function show(userComponentOrViewFunction, config, componentConfig) {
        // config supports extraStyling and onclose
        if (typeof config === "string") {
            config = { extraStyling: config }
        }
        if (!config) config = {}
        if (!config.extraStyling) { config.extraStyling = "" }
        
        let div = document.createElement("div")
        
        const userComponent = userComponentOrViewFunction.view ?
            userComponentOrViewFunction : {
                view: userComponentOrViewFunction
            }
        
        function protect(viewFunction) {
            return function() {
                let subview
                try {
                    subview = viewFunction.call(arguments)
                } catch (e) {
                    console.log("Error in show function", e)
                    subview = m("div.ba.ma2.pa2.bg-red", "Error in show function: " + e)
                }
                return subview
            }
        }
        userComponent.view = protect(userComponent.view)

        const ClosableComponent = {            
            view() {
                const isCloseButtonShown = location.hash.startsWith("#open=")
                return m("div.ba.ma3.pa3.bg-light-purple.relative" + config.extraStyling,
                    m(userComponent, componentConfig),
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
    
    function newItem() {
        return {
            entity: "",
            attribute: "",
            value: "",
            contentType: "",
            encoding: "",
            contributor: "",
            timestamp: "",
            derivedFrom: "",
            license: ""
        }
    }
    
    const WorkspaceView = {
        editor: null,
        lastLoadedContents: "",
        currentItemId: null,
        currentItem: newItem(),
        
        currentContributor: "",
        currentJournal: JournalUsingLocalStorage,
        journalChoice: "local storage",
        aceEditorHeight: 20,
        toastMessages: [],
        editorMode: "ace/mode/javascript",
        wasEditorDirty: false,
        focusMode: false,
        
        // to support user-defined extensions
        extensions: {},
        
        // Used for resizing the editor's height
        dragOriginY: 0,
        
        show: show,
        
        oninit() {
            WorkspaceView.currentContributor = localStorage.getItem("_contributor") || ""

            if (WorkspaceView.currentJournal.itemCount() === 0) {
                WorkspaceView.show(function () { 
                    return [
                        m("div", "Thanks for trying Twirlip7, an experimental Mithril.js playground -- with aspirations towards becoming a distributed social semantic desktop."),
                        m("div", "To get started with some example code snippets, click \"Show example journal\", then \"Merge journal\", then \"Next\", and then \"Do it\"."),
                        m("div", "Use \"Previous\" and \"Next\" to scroll through more example snippets. \"Inspect it\" puts evaluation results for selected text into the console log.")
                    ]
                })
            }
        },
        
        saveCurrentItemId() {
            if (WorkspaceView.currentItemId !== null) {
                localStorage.setItem("_current_" + WorkspaceView.journalChoice, WorkspaceView.currentItemId)
            } else {
                localStorage.setItem("_current_" + WorkspaceView.journalChoice, "")
            }
        },
        
        restoreCurrentItemId() {
            const storedItemId = localStorage.getItem("_current_" + WorkspaceView.journalChoice)
            WorkspaceView.goToKey(storedItemId, "ignoreDirty")
        },

        changeJournal(newChoice) {
            const oldChoice = WorkspaceView.journalChoice
            if (newChoice === oldChoice) return
            if (!WorkspaceView.confirmClear()) return

            WorkspaceView.saveCurrentItemId()
            WorkspaceView.journalChoice = newChoice
            WorkspaceView.currentJournal = (newChoice === "memory" ? JournalUsingMemory : JournalUsingLocalStorage)
            WorkspaceView.restoreCurrentItemId()
        },

        setEditorContents(newContents, isNotSaved) {
            WorkspaceView.editor.setValue(newContents)
            WorkspaceView.wasEditorDirty = false
            if (!isNotSaved) { 
                WorkspaceView.lastLoadedContents = newContents
            } else {
                WorkspaceView.currentItemId = null
                WorkspaceView.saveCurrentItemId()
            }
            WorkspaceView.editor.selection.clearSelection()
            WorkspaceView.editor.selection.moveCursorFileStart()
            WorkspaceView.editor.getSession().setScrollTop(0)
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
         
        prepareCurrentItemForSaving(value) {
            // TODO: reference previous if relevant and also set timestamps and author as needed
            WorkspaceView.currentItem.value = value
            WorkspaceView.currentItem.timestamp = new Date().toISOString()
            WorkspaceView.currentItem.contributor = WorkspaceView.currentContributor
            WorkspaceView.currentItem.derivedFrom = WorkspaceView.currentItemId || ""
            // TODO: Maybe check about license?
            // TODO: canonicalize JSON
            return JSON.stringify(WorkspaceView.currentItem)
        },

        save() {
            const newContents = WorkspaceView.getEditorContents()
            const itemJSON = WorkspaceView.prepareCurrentItemForSaving(newContents)
            const addResult = WorkspaceView.currentJournal.addItem(itemJSON)
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
            WorkspaceView.currentItemId = addResult.id
            WorkspaceView.saveCurrentItemId()
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
            WorkspaceView.currentItemId = null
            WorkspaceView.currentItem = newItem()
            WorkspaceView.saveCurrentItemId()
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
            if (WorkspaceView.currentJournal !== JournalUsingLocalStorage) {
                alert("Snippets need to be in the local storage journal (not memory)\nto be opened in a new window.")
                return
            }
            if (WorkspaceView.currentItemId === null) {
                alert("To open a snippet in its own window, you need to\nnavigate to a snippet from local storage first or save a new one.")
                return
            }
            window.open("#open=" + WorkspaceView.currentItemId)
        },
        
        importText() {
            if (!WorkspaceView.confirmClear()) return
            FileUtils.loadFromFile((fileName, fileContents) => {
                if (fileContents) {
                    const newContent = fileContents
                    WorkspaceView.setEditorContents(newContent)
                    WorkspaceView.currentItemId = null
                    WorkspaceView.lastLoadedContents = ""
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
            if (!WorkspaceView.currentJournal.itemCount()) {
                WorkspaceView.toast("No journal items to display. Try saving one first -- or show the example journal in the editor and then load it.")
                return
            }
            if (WorkspaceView.currentJournal.itemCount() === 1) {
                WorkspaceView.toast("Only one journal item to display. Try saving another one first.")
                return
            }
            const key = WorkspaceView.currentJournal.skip(WorkspaceView.currentItemId, delta, wrap)
            WorkspaceView.goToKey(key)
        },

        goToKey(key, ignoreDirty) {
            // First check is to prevent losing redo stack if not moving
            if (key === WorkspaceView.currentItemId && !WorkspaceView.isEditorDirty()) return
            if (!ignoreDirty && !WorkspaceView.confirmClear()) return
            let itemText = WorkspaceView.currentJournal.getItem(key)
            let item
            if (itemText === undefined || itemText === null) {
                key = null
                item = newItem()
            } else if (itemText[0] !== "{") {
                // TODO: remove legacy development support
                item = newItem()
                item.value = itemText
            } else {
                item = JSON.parse(itemText)
            }
            WorkspaceView.currentItemId = key
            WorkspaceView.currentItem = item
            WorkspaceView.setEditorContents(item.value || "")
            WorkspaceView.saveCurrentItemId()
            WorkspaceView.setEditorModeForContentType(item.contentType)
        },

        // TODO: Improve adhoc partial handling of character types which also ignores character set

        setEditorModeForContentType(contentType) {
            let newMode = "javascript"
            if (contentType) {
                // try to change editor mode to match content type
                contentType = contentType.trim().toLowerCase()
                if (contentType === "application/javascript") {
                    newMode = "javascript"
                } else if (contentType === "application/json") {
                    newMode = "json"
                } else if (contentType.startsWith("text/markdown")) {
                    newMode = "markdown"
                } else if (contentType.startsWith("text/html")) {
                    newMode = "html"
                } else if (contentType.startsWith("text/xml")) {
                    newMode ="xml"
                } else if (contentType.startsWith("image/svg+xml")) {
                    newMode = "svg"
                } else if (contentType.startsWith("text/plain")) {
                    newMode = "text"
                } else if (contentType.startsWith("text/x-")) {
                    // TODO: Improve this to deal with chatracter encoding or other parameters after a semicolon
                    newMode = contentType.substring("text/x-".length)
                }
            }

            newMode = "ace/mode/" + newMode

            WorkspaceView.editorMode = newMode
            WorkspaceView.editor.getSession().setMode(newMode)
        },

        guessContentTypeForEditorMode(editorMode) {
            const modeName = editorMode.substring("ace/mode/".length)
            if (modeName === "javascript") return "application/javascript"
            if (modeName == "json") return "application/json"
            if (modeName === "html") return "text/html"
            if (modeName === "markdown") return "text/markdown; charset=utf-8"
            if (modeName == "xml") return "text/xml"
            if (modeName == "svg") return "image/svg+xml"
            if (modeName == "text") return "text/plain; charset=utf-8"
            return "text/x-" + modeName
        },

        goFirst() { WorkspaceView.skip(-1000000) },

        goPrevious() { WorkspaceView.skip(-1) },

        goNext() { WorkspaceView.skip(1) },

        goLast() { WorkspaceView.skip(1000000) },

        showJournal() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.setEditorContents(WorkspaceView.currentJournal.textForJournal())
            WorkspaceView.currentItemId = null
        },

        replaceJournal() {
            if (WorkspaceView.currentJournal.itemCount() && !confirm("Replace all items with entered text for a journal?")) return
            try {
                WorkspaceView.currentJournal.loadFromJournalText(WorkspaceView.getEditorContents())
            } catch (error) {
                WorkspaceView.toast("Problem replacing journal from editor:\n" + error)
                return
            }
            WorkspaceView.currentItemId = null
            // Update lastLoadedContents in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedContents = WorkspaceView.getEditorContents()
            WorkspaceView.toast("Replaced journal from editor")
        },
        
        mergeJournal() {
            if (WorkspaceView.currentJournal.itemCount() && !confirm("Merge existing journal items with entered text for a journal?")) return
            try {
                let addedItemCount = 0
                const newJournalItems = JSON.parse(WorkspaceView.getEditorContents())
                for (let itemJSON of newJournalItems) {
                    const addResult = WorkspaceView.currentJournal.addItem(itemJSON)
                    if (!addResult.existed) addedItemCount++
                }
                WorkspaceView.toast("Added " + addedItemCount + " item" + ((addedItemCount === 1 ? "" : "s")) + " to existing journal")
            } catch (error) {
                WorkspaceView.toast("Problem merging journal from editor:\n" + error)
                return
            }
            WorkspaceView.currentItemId = null
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
                m("span.ml1", "uses"),
                m("a.ml1", { target: "_blank", href: "https://mithril.js.org/" }, "Mithril"),
                m("a", { target: "_blank", href: "https://github.com/MithrilJS/mithril.js" }, ".js"),
                m("a.ml2", { target: "_blank", href: "http://tachyons.io/" }, "Tachyons"),
                m("a", { target: "_blank", href: "https://github.com/tachyons-css/tachyons/blob/master/css/tachyons.css" }, ".css"),
                m("a.ml2", { target: "_blank", href: "https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts" }, "Ace"),
                m("a.ml2", { target: "_blank", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" }, "JavaScript"),
                m("span.ml2", "|"),
                m("a.ml2", { target: "_blank", href: "https://arthurclemens.github.io/mithril-template-converter" }, "HTML->Mithril")
            ])
        },
        
        viewNavigate() {
            const itemCount = WorkspaceView.currentJournal.itemCount()
            const itemIndex = WorkspaceView.currentJournal.locationForKey(WorkspaceView.currentItemId)
            
            function isPreviousDisabled() {
                if (itemCount === 0) return true
                // Allow null item index to go to first or last
                if (itemIndex === null) return false
                if (itemIndex === 0) return true
                return false
            }
            
            function isNextDisabled() {
                if (itemCount === 0) return true
                // Allow null item index to go to first or last
                if (itemIndex === null) return false
                if (itemIndex >= itemCount - 1) return true
                return false
            }
            
            function itemIdentifierClicked() {
                const newItemId = prompt("Go to item id", WorkspaceView.currentItemId)
                if (!newItemId || newItemId === WorkspaceView.currentItemId) return
                // TODO: Should have a check for "exists"
                if (WorkspaceView.currentJournal.getItem(newItemId) === null) {
                    alert("Could not find item for id:\n" + newItemId)
                } else {
                    WorkspaceView.goToKey(newItemId)
                }
            }
            
            function itemPositionClicked() {
                const newItemIndex = prompt("Go to item index", itemIndex === null ? "" : itemIndex + 1)
                if (!newItemIndex || newItemIndex === itemIndex) return
                const newItemId = WorkspaceView.currentJournal.keyForLocation(parseInt(newItemIndex) - 1)
                // TODO: Should have a check for "exists"
                if (WorkspaceView.currentJournal.getItem(newItemId) === null) {
                    alert("Could not find item for index:\n" + newItemIndex)
                } else {
                    WorkspaceView.goToKey(newItemId)
                }
            }
            
            const undoManager = WorkspaceView.editor && WorkspaceView.editor.getSession().getUndoManager()
            const itemIdentifier = (WorkspaceView.currentItemId === null) ? 
                "???" : 
                ("" + WorkspaceView.currentItemId).substring(0, 12) + ((("" + WorkspaceView.currentItemId).length > 12) ? "..." : "")
            return m("h4.ba.pa1",
                m("button.ma1", { onclick: WorkspaceView.goFirst, title: "Go to first snippet", disabled: isPreviousDisabled() }, "|<"),
                m("button.ma1", { onclick: WorkspaceView.goPrevious, title: "Go to earlier snippet", disabled: isPreviousDisabled() }, "< Previous"),
                m("button.ma1", { onclick: WorkspaceView.goNext, title: "Go to later snippet", disabled: isNextDisabled() }, "Next >"),
                m("button.ma1", { onclick: WorkspaceView.goLast, title: "Go to last snippet", disabled: isNextDisabled() }, ">|"),
               "Item ",
                m("span", { title: "Click to jump to different item by identifier", onclick: itemIdentifierClicked }, itemIdentifier),
                WorkspaceView.currentJournal.getCapabilities().idIsPosition ? 
                    "" : 
                    m("span", { onclick: itemPositionClicked, title: "Click to jump to different item by index" },
                        " : " + (itemIndex === null ?
                        "???" : 
                        (itemIndex + 1))
                    ),
                " of ",
                itemCount,
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
                WorkspaceView.currentItem.contentType = WorkspaceView.guessContentTypeForEditorMode(newEditorMode)
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
        
        viewContext() {
            return [
                m("div.ma1",
                    m("span.dib.w3.tr.mr2", "Entity"),
                    m("input.w-80", {value: WorkspaceView.currentItem.entity || "", onchange: event => WorkspaceView.currentItem.entity = event.target.value})
                ),
                m("div.ma1",
                    m("span.dib.w3.tr.mr2", "Attribute"),
                    m("input.w-80", {value: WorkspaceView.currentItem.attribute || "", onchange: event => WorkspaceView.currentItem.attribute = event.target.value})
                ),
                m("div.ma1",
                    m("span.dib.w3.tr.mr2", "Value")
                ), 
            ]
        },
        
        viewAuthor() {
            return [
                m("div.ma1",
                    m("span.dib.w4.tr.mr2", "Content type"),
                    m("input.w-40", {value: WorkspaceView.currentItem.contentType || "", onchange: event => WorkspaceView.currentItem.contentType = event.target.value}),
                    m("span.pa2"),
                    m("span.dib.w4.tr.mr2", {title: "content transfer encoding like \"base64\" for binary data"}, "Encoding"),
                    m("input.w-20", {value: WorkspaceView.currentItem.encoding || "", onchange: event => WorkspaceView.currentItem.encoding = event.target.value})
                ),  
                m("div.ma1",
                    m("span.dib.w4.tr.mr2", WorkspaceView.viewContributor()),
                    m("input.w-40", {value: WorkspaceView.currentItem.contributor || "", onchange: event => WorkspaceView.currentItem.contributor = event.target.value}),
                    m("span.pa2"),
                    m("span.dib.w4.tr.mr2", "Timestamp"),
                    m("input.w-20", {value: WorkspaceView.currentItem.timestamp || "", onchange: event => WorkspaceView.currentItem.timestamp = event.target.value})
                ),
                m("div.ma1",
                    m("span.dib.w4.tr.mr2", {
                        title: "click to go to item",
                        onclick: () => { if (WorkspaceView.currentItem.derivedFrom) WorkspaceView.goToKey(WorkspaceView.currentItem.derivedFrom) },
                    }, "Derived from"),
                    m("input.w-40", {value: WorkspaceView.currentItem.derivedFrom || "", onchange: event => WorkspaceView.currentItem.derivedFrom = event.target.value}),
                    m("span.pa2"),
                    m("span.dib.w4.tr.mr2", "License"),
                    m("input.w-20", {value: WorkspaceView.currentItem.license || "", onchange: event => WorkspaceView.currentItem.license = event.target.value})
                )
            ]
        },
        
        viewContributor() {
            return m("span", {
                onclick: event => {
                    const contributor = prompt("contributor", WorkspaceView.currentContributor)
                    if (contributor !== null) {
                        WorkspaceView.currentContributor = contributor
                        localStorage.setItem("_contributor", contributor)
                    }
                },
                title: "Click to set current contributor" + (WorkspaceView.currentContributor ? "\n" + WorkspaceView.currentContributor : ""),
            }, "Contributor") // , WorkspaceView.currentContributor || "<configure>")
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
                    WorkspaceView.editor.getSession().on("change", function() {
                        const isEditorDirty = WorkspaceView.isEditorDirty()
                        if (isEditorDirty !== WorkspaceView.wasEditorDirty) {
                            WorkspaceView.wasEditorDirty = isEditorDirty
                            // Use setTimeout to give undo manager some time to update itself
                            setTimeout(m.redraw, 0)
                        }
                    })
                    // Bind a key for saving
                    WorkspaceView.editor.commands.addCommand({
                        name: "save",
                        bindKey: {win: "Ctrl-S",  mac: "Command-S"},
                        exec: function() {
                            WorkspaceView.save()
                            // Need to redraw here because this event handling is outside of Mithril
                            m.redraw()
                        },
                        readOnly: false
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
                    WorkspaceView.dragOriginY = event.screenY
                    event.dataTransfer.setData("Text", event.target.id)
                    event.dataTransfer.effectAllowed = "none"
                },
                ondragend: (event) => {
                    const yDifference = event.screenY - WorkspaceView.dragOriginY
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
            const isStartupItem = startupInfo.startupItemIds.indexOf(WorkspaceView.currentItemId) !== -1
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
                m("input[type=checkbox].ma1", {
                    checked: isStartupItem,
                    disabled: WorkspaceView.currentJournal !== JournalUsingLocalStorage,
                    onclick: toggleUseAtStartup.bind(null, isStartupItem, WorkspaceView.currentItemId),
                    title: helpText
                }),
                m("span", {title: helpText}, "Bootstrap it"),
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
                m("span.ma1", {  title: "focus mode hides extraneous editor controls to provide more space for testing" },
                    m("input[type=checkbox].ma1", { 
                        checked: WorkspaceView.focusMode,
                        onchange: (event) => WorkspaceView.focusMode = event.target.checked
                    }),
                    "focus"
                )
            ]
        },
        
        viewBreak() {
            return m("br")
        },
        
        viewJournalButtons() {
            function journalChanged(event) {
                WorkspaceView.changeJournal(event.target.value)
            }
            return [
                "Journal",
                m("select.ma2", { onchange: journalChanged, title: "Change storage location of snippets" }, 
                    m("option", { value: "local storage", selected: WorkspaceView.journalChoice === "local storage" }, "local storage"),
                    m("option", { value: "memory", selected: WorkspaceView.journalChoice === "memory" }, "memory")
                ),
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
            const focusMode = WorkspaceView.focusMode
            return [
                WorkspaceView.viewToast(),
                focusMode ? [] : WorkspaceView.viewExtensionsHeader(),
                focusMode ? [] : WorkspaceView.viewAbout(),
                focusMode ? [] : WorkspaceView.viewNavigate(),
                focusMode ? [] : WorkspaceView.viewContext(),
                WorkspaceView.viewEditor(),
                focusMode ? [] : WorkspaceView.viewAuthor(),
                WorkspaceView.viewSplitter(),
                focusMode ? [] : WorkspaceView.viewExtensionsMiddle(),
                WorkspaceView.viewEvaluateButtons(),
                WorkspaceView.viewSpacer(),
                WorkspaceView.viewEditorButtons(),
                WorkspaceView.viewBreak(),
                focusMode ? [] : WorkspaceView.viewJournalButtons(),
                focusMode ? [] : WorkspaceView.viewExtensionsFooter(),
            ]
        },

        view() {
            return m("#main.ma2", WorkspaceView.viewMain())
        },
    }
    
    return WorkspaceView
})
