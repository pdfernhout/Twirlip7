define(["FileUtils", "EvalUtils", "JournalUsingMemory", "JournalUsingLocalStorage", "JournalUsingServer", "ace/ace", "ace/ext/modelist", "ExampleJournalLoader", "CanonicalJSON", "vendor/sha256"], function(
    FileUtils,
    EvalUtils,
    JournalUsingMemory,
    JournalUsingLocalStorage,
    JournalUsingServer,
    ace,
    modelist,
    ExampleJournalLoader,
    CanonicalJSON,
    sha256
) {
    "use strict"
    /* global m, location, localStorage, Twirlip7 */

    // Convenience function which examples could use to put up closeable views
    function show(userComponentOrViewFunction, config, componentConfig) {
        // config supports extraStyling and onclose and collapsedTitle (as string or function)
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
        
        let collapsed = false
        
        function collapsedTitle() {
            if (config.collapsedTitle === undefined || config.collapsedTitle === null) return "Untitled"
            if (typeof config.collapsedTitle === "function") return config.collapsedTitle()
            return config.collapsedTitle
        }

        const ClosableComponent = {            
            view() {
                const isCloseButtonHidden = location.hash.startsWith("#open=")
                return m("div.ba.ma3.pa3.bg-light-purple.relative" + config.extraStyling,
                    m("div",
                        { style: collapsed ? "display: none" : "display: block" },
                        m(userComponent, componentConfig)
                    ),
                    collapsed ? collapsedTitle() : [],
                    isCloseButtonHidden ? [] : [
                        m("button.absolute", {
                            style: "top: 0.25rem; right: 3rem; min-width: 1.5rem",
                            title: collapsed ? "Expand" : "Collapse",
                            onclick: () => collapsed = !collapsed
                        }, (collapsed ? "+" : "-")),
                        m("button.absolute", {
                            style: "top: 0.25rem; right: 1rem",
                            title: "Close",
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
                    ]
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
    
    const twirlip7DataUrlPrefix = "twirlip7://v1/"
    
    const WorkspaceView = {
        editor: null,
        
        lastLoadedItem: newItem(),
        
        currentItemId: null,
        currentItem: newItem(),
        
        currentContributor: "",
        
        currentJournal: JournalUsingLocalStorage,
        journalChoice: "local storage",
        
        isLastEntityMatch: false,
        isLastEntityAttributeMatch: false,
        
        aceEditorHeight: 20,
        editorMode: "ace/mode/javascript",
        wasEditorDirty: false,
        
        focusMode: false,
        collapseWorkspace: false,
        
        // to support user-defined extensions
        extensions: {},
        
        toastMessages: [],
        
        // Used for resizing the editor's height
        dragOriginY: 0,
        
        show: show,
        
        newItem: newItem,
        
        oninit() {
            if (JournalUsingLocalStorage.itemCount() === 0) {
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
                location.hash = "#item=" + WorkspaceView.currentItemId
            } else {
                localStorage.setItem("_current_" + WorkspaceView.journalChoice, "")
                location.hash = "#"
            }
        },
        
        fetchStoredItemId() {
            const storedItemId = localStorage.getItem("_current_" + WorkspaceView.journalChoice)
            return storedItemId
        },
        
        restoreCurrentItemId() {
            let storedItemId = WorkspaceView.fetchStoredItemId()
            // Memory is transient on reload, so don't try to go to missing keys to avoid a warning
            if (WorkspaceView.journalChoice === "memory" && WorkspaceView.currentJournal.getItem(storedItemId) === null) storedItemId = null
            WorkspaceView.goToKey(storedItemId, {ignoreDirty: true})
        },
        
        saveJournalChoice() {
            localStorage.setItem("_currentJournalChoice", WorkspaceView.journalChoice)
        },
        
        restoreJournalChoice() {
            const newChoice = localStorage.getItem("_currentJournalChoice")
            if (newChoice) {
                const newJournal = WorkspaceView.journalsAvailable()[newChoice]
                if (newJournal) {
                    WorkspaceView.journalChoice = newChoice
                    WorkspaceView.currentJournal = newJournal
                } else{
                    alert("Journal not available for: " + newChoice)
                }
            }
        },
        
        journalsAvailable() {
            const journals = {
                "local storage": JournalUsingLocalStorage,
                "memory": JournalUsingMemory,
                "server": JournalUsingServer.socket ? JournalUsingServer : null
            }
            return journals
        },

        changeJournal(newChoice) {
            const oldChoice = WorkspaceView.journalChoice
            if (newChoice === oldChoice) return
            
            const newJournal = WorkspaceView.journalsAvailable()[newChoice]
            if (!newJournal) {
                alert("Journal not available for: " + newChoice)
                return
            }
            
            if (!WorkspaceView.confirmClear()) return

            WorkspaceView.saveCurrentItemId()
            WorkspaceView.journalChoice = newChoice
            WorkspaceView.currentJournal = newJournal
            WorkspaceView.restoreCurrentItemId()
            WorkspaceView.saveJournalChoice()
        },

        setEditorContents(newContents, keepUndo) {
            WorkspaceView.editor.setValue(newContents)
            WorkspaceView.editor.selection.clearSelection()
            WorkspaceView.editor.selection.moveCursorFileStart()
            WorkspaceView.editor.getSession().setScrollTop(0)
            // Replace undoManager since getUndoManager().reset() does not see to work well enough here
            if (!keepUndo) WorkspaceView.editor.getSession().setUndoManager(new ace.UndoManager())
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
            // TODO: Maybe check to be sure there is a license?
            return CanonicalJSON.stringify(WorkspaceView.currentItem)
        },

        save() {
            if (!WorkspaceView.isEditorDirty()) {
                if (!confirm("There are no changes.\nSave a new item anyway with a later timestamp?")) return
            }
            if (!WorkspaceView.currentContributor) {
                if (!WorkspaceView.promptForContributor()) return
            }
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
            WorkspaceView.updateLastLoadedItemFromCurrentItem()
            WorkspaceView.wasEditorDirty = false
            WorkspaceView.currentItemId = addResult.id
            WorkspaceView.saveCurrentItemId()
            WorkspaceView.updateIsLastMatch(true)
            WorkspaceView.setDocumentTitleForCurrentItem()
        },
        
        interceptSaveKey(evt) {
            // derived from: https://stackoverflow.com/questions/2903991/how-to-detect-ctrlv-ctrlc-using-javascript
            evt = evt || window.event // IE support
            var c = evt.keyCode
            var ctrlDown = evt.ctrlKey || evt.metaKey // Mac support
        
            // Check for Alt+Gr (http://en.wikipedia.org/wiki/AltGr_key)
            if (ctrlDown && evt.altKey) return true
        
            // Check for ctrl+s
            if (ctrlDown && c == 83) {
                WorkspaceView.save()
                return false
            }
        
            // Otherwise allow
            return true
        },
        
        isEditorDirty() {
            // TODO: compare individual strings instead of use CanonicalJSON.stringify to be more efficient
            return WorkspaceView.editor && (CanonicalJSON.stringify(WorkspaceView.lastLoadedItem) !== CanonicalJSON.stringify(WorkspaceView.currentItem))
        },

        confirmClear(promptText) {
            if (!WorkspaceView.getEditorContents()) return true
            if (!WorkspaceView.isEditorDirty()) return true
            if (!promptText) promptText = "You have unsaved editor changes. Proceed?"
            return confirm(promptText)
        },

        clear() {
            if (!WorkspaceView.confirmClear()) return
            // Preserve some fields if it has a value -- so can push twice to totally clear
            const oldItem = WorkspaceView.currentItem
            WorkspaceView.currentItemId = null
            WorkspaceView.currentItem = newItem()
            if (oldItem.value) {
                WorkspaceView.currentItem.entity = oldItem.entity
                WorkspaceView.currentItem.attribute = oldItem.attribute
                WorkspaceView.currentItem.contentType = oldItem.contentType
                WorkspaceView.currentItem.encoding = oldItem.encoding
                WorkspaceView.currentItem.license = oldItem.license
            }
            WorkspaceView.setEditorContents(WorkspaceView.currentItem.value)
            WorkspaceView.wasEditorDirty = false
            WorkspaceView.saveCurrentItemId()
            WorkspaceView.updateIsLastMatch()
        },

        doIt() {
            const selection = WorkspaceView.getSelectedEditorText()
            try {
                EvalUtils.eval(selection.text)
            } catch (error) {
                WorkspaceView.toast("Eval error:\n" + error)
            }
        },

        printIt(event, callback) {
            if (!callback) callback = EvalUtils.evalOrError
            
            const selection = WorkspaceView.getSelectedEditorText()
            const evalResult = callback(selection.text)
            const textToInsert = " " + evalResult
            
            if (selection.isNoSelection) { WorkspaceView.editor.selection.moveCursorFileEnd() }
            const selectedRange = WorkspaceView.editor.selection.getRange()
            const start = selectedRange.end
            const end = WorkspaceView.editor.session.insert(start, textToInsert)
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
                alert("Snippets need to be in the local storage journal (not memory or server)\nto be opened in a new window.")
                return
            }
            if (WorkspaceView.currentItemId === null) {
                alert("To open a snippet in its own window, you need to\nnavigate to a snippet from local storage first or save a new one.")
                return
            }
            window.open("#open=" + WorkspaceView.currentItemId)
        },
        
        importText(convertToBase64) {
            if (!WorkspaceView.confirmClear()) return
            FileUtils.loadFromFile(convertToBase64, (fileName, fileContents) => {
                if (fileContents) {
                    const newContent = fileContents
                    WorkspaceView.setEditorContents(newContent, "keepUndo")
                    // We don't know if the text is changed, so use null for wasEditorDirty
                    WorkspaceView.wasEditorDirty = null
                    WorkspaceView.currentItem.encoding = convertToBase64 ? "base64" : ""
                    m.redraw()
                }
            })
        },
        
        importTextPlain() {
            WorkspaceView.importText(false)
        },
        
        importTextAsBase64() {
            WorkspaceView.importText(true)
        },
        
        exportText() {
            const fileContents = WorkspaceView.getEditorContents()
            const provisionalFileName = fileContents.split("\n")[0]
            FileUtils.saveToFile(provisionalFileName, fileContents)
        },
        
        makeDataURLForItemId(itemId) {
            const itemText = WorkspaceView.currentJournal.getItem(itemId)
            const encodedText = encodeURIComponent(itemText)
            const dataURL = twirlip7DataUrlPrefix + itemId + "/" + itemText.length + "/" + encodedText.length + "/" + encodedText
            return { itemId, itemText, dataURL }
        },
               
        displayCurrentTriple() {
            if (WorkspaceView.currentItemId) {
                if (!WorkspaceView.confirmClear()) return
                const dataURL = WorkspaceView.makeDataURLForItemId(WorkspaceView.currentItemId).dataURL
                WorkspaceView.showText(dataURL, "text/plain")
                WorkspaceView.editor.selection.selectAll()
                WorkspaceView.editor.focus()
            } else {
                alert("Please select a saved triple first")
            }
        },
        
        displayCurrentTripleAndHistory() {
            if (WorkspaceView.currentItemId) {
                if (!WorkspaceView.confirmClear()) return
                let dataURLs = []
                let itemId = WorkspaceView.currentItemId
                while (itemId) {
                    const dataURLConversionResult = WorkspaceView.makeDataURLForItemId(itemId)
                    dataURLs.unshift(dataURLConversionResult.dataURL)
                    const item = Twirlip7.getItemForJSON(dataURLConversionResult.itemText)
                    itemId = item.derivedFrom
                }
                const textForAllItems = dataURLs.join("\n")
                WorkspaceView.showText(textForAllItems, "text/plain")
                WorkspaceView.editor.selection.selectAll()
                WorkspaceView.editor.focus()
            } else {
                alert("Please select a saved triple first")
            }
        },
        
        makeTripleForDataURL(dataURL) {
            if (dataURL) {
                if (!dataURL.startsWith(twirlip7DataUrlPrefix)) {
                    alert("item should start with: " + twirlip7DataUrlPrefix)
                    return null
                }
                
                const subparts = dataURL.substring(twirlip7DataUrlPrefix.length).split("/")
                if (subparts.length != 4) {
                    alert("Twirlip7 data URL should have exactly four subparts: key/itemLength/contentsLength/contents")
                    return null
                }
                
                const key = subparts[0]
                const itemLength = parseInt(subparts[1])
                const contentsLength = parseInt(subparts[2])
                const encodedText = subparts[3]
                
                if (encodedText.length !== contentsLength) {
                    alert("Twirlip7 data URL contents length of " + encodedText.length + " does not match expected length of " + contentsLength)
                    return null
                }
                
                const itemText = decodeURIComponent(encodedText)
                if (itemText.length !== itemLength) {
                    alert("Twirlip7 data URL decoded item length of " + itemText.length + " does not match expected length of " + itemLength)
                    return null
                }
                
                const itemSHA256 = "" + sha256.sha256(itemText)
                if (itemSHA256 !== key) {
                    alert("Twirlip7 data URL decoded item sha256 of " + itemSHA256 + " does not match expected sha256 of " + key)
                    return null
                }
                
                // TODO: Consolidate the copy/paste adding of item with where this is copied from
                const addResult = WorkspaceView.currentJournal.addItem(itemText)
                if (addResult.error) {
                    alert("save failed -- maybe too many localStorage items?\n" + addResult.error)
                    return null
                }
                
                return key
            } else {
                alert("Please enter a Twirlip 7 data url starting with " + twirlip7DataUrlPrefix)
                return null
            }
        },
        
        readTriplesFromDataURLs() {
            const textForAllItems = WorkspaceView.getSelectedEditorText().text.trim()
            const dataURLs = textForAllItems.split("\n")
            const keys = []
            for (let dataURL of dataURLs) {
                const key = WorkspaceView.makeTripleForDataURL(dataURL)
                if (!key) break
                keys.push(key)
            }
            if (keys.length && keys.length === dataURLs.length) {
                WorkspaceView.goToKey(keys[keys.length - 1], {ignoreDirty: true})
            }
        },

        skip(delta, wrap) {
            if (!WorkspaceView.currentJournal.itemCount()) {
                WorkspaceView.toast("No journal items to display. Try saving one first -- or show the example journal in the editor and then load it.")
                return
            }
            const key = WorkspaceView.currentJournal.skip(WorkspaceView.currentItemId, delta, wrap)
            WorkspaceView.goToKey(key)
        },

        goToKey(key, options) {
            if (!options) options = {}
            // First check is to prevent losing redo stack and cursor position if not moving
            if (!options.reload && key === WorkspaceView.currentItemId) return
            if (!options.ignoreDirty && !WorkspaceView.confirmClear()) return
            let itemText = WorkspaceView.currentJournal.getItem(key)
            let item
            if (itemText === undefined || itemText === null) {
                if (key) WorkspaceView.toast("item not found for:\n\"" + key + "\"")
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
            WorkspaceView.wasEditorDirty = false
            WorkspaceView.updateLastLoadedItemFromCurrentItem()
                                    
            WorkspaceView.setEditorModeForContentType(item.contentType)
            
            WorkspaceView.saveCurrentItemId()
            WorkspaceView.updateIsLastMatch()
            WorkspaceView.setDocumentTitleForCurrentItem()
        },

        setDocumentTitleForCurrentItem() {
            let newTitle
            if (!WorkspaceView.currentItem.entity && !WorkspaceView.currentItem.attribute) {
                newTitle = "Twirlip7"
            } else {
                newTitle = WorkspaceView.currentItem.entity + " :: " + WorkspaceView.currentItem.attribute 
            }
            document.title = newTitle
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
                    newMode = "xml"
                } else if (contentType.startsWith("image/svg+xml")) {
                    newMode = "svg"
                } else if (contentType.startsWith("text/plain")) {
                    newMode = "text"
                } else if (contentType.startsWith("text/x-")) {
                    // TODO: Improve this to deal with chatracter encoding or other parameters after a semicolon
                    newMode = contentType.substring("text/x-".length)
                } else if (contentType.startsWith("image/")) {
                    newMode = "text"
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
        
        goToLatestForEntity() {
            const key = WorkspaceView.findLatestForEntity()
            if (key) {
                WorkspaceView.goToKey(key)
            }
        },
        
        goToLatestForEntityAttribute() {
            const key = WorkspaceView.findLatestForEntityAttribute()
            if (key) {
                WorkspaceView.goToKey(key)
            }
        },
        
        findLatestForEntity() {
            const matches = Twirlip7.findItem({entity: WorkspaceView.currentItem.entity}, { includeMetadata: true, sortBy: "location" })
            if (matches.length) {
                return matches[0].key
            }
            return null
        },
        
        findLatestForEntityAttribute() {
            const matches = Twirlip7.findItem({
                entity: WorkspaceView.currentItem.entity,
                attribute: WorkspaceView.currentItem.attribute
            }, { includeMetadata: true, sortBy: "location" })
            if (matches.length) {
                return matches[0].key
            }
            return null
        },
        
        updateIsLastMatch(value) {
            // TODO: Computing these two variables is CPU intensive as they both iterate over all items
            if (value !== undefined) {
                WorkspaceView.isLastEntityMatch = value
                WorkspaceView.isLastEntityAttributeMatch = value
                return
            }
            if (WorkspaceView.isEditorDirty() || !WorkspaceView.currentItemId) {
                WorkspaceView.isLastEntityMatch = !WorkspaceView.findLatestForEntity()
                WorkspaceView.isLastEntityAttributeMatch = !WorkspaceView.findLatestForEntityAttribute()
                return
            }
            if (WorkspaceView.currentItemId) {
                WorkspaceView.isLastEntityMatch = WorkspaceView.findLatestForEntity() === WorkspaceView.currentItemId
                WorkspaceView.isLastEntityAttributeMatch = WorkspaceView.findLatestForEntityAttribute() === WorkspaceView.currentItemId
            }
        },
        
        updateLastLoadedItemFromCurrentItem() {
            WorkspaceView.lastLoadedItem = JSON.parse(JSON.stringify(WorkspaceView.currentItem))
        },
        
        showText(newText, contentType) {
            // WorkspaceView.currentItemId = null
            WorkspaceView.currentItem = newItem()
            WorkspaceView.currentItem.value = newText
            WorkspaceView.currentItem.contentType = contentType
            
            WorkspaceView.setEditorContents(newText)
            WorkspaceView.wasEditorDirty = false
            WorkspaceView.updateLastLoadedItemFromCurrentItem()
            
            WorkspaceView.setEditorModeForContentType(WorkspaceView.currentItem.contentType)
            // WorkspaceView.saveCurrentItemId()
            WorkspaceView.updateIsLastMatch(true)
        },
        
        showJournal(journalText) {
            WorkspaceView.showText(journalText, "application/json")
        },

        showCurrentJournal() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.showJournal(WorkspaceView.currentJournal.textForJournal())
        },

        showExampleJournal() {
            if (!WorkspaceView.confirmClear()) return
            WorkspaceView.progress("Loading examples; please wait...")
            ExampleJournalLoader.loadAllFiles(
                (progressMessage) => {
                    WorkspaceView.progress(progressMessage)
                    m.redraw()
                },
                (exampleJournal) => {
                    WorkspaceView.showJournal(JSON.stringify(exampleJournal, null, 4))
                    WorkspaceView.progress(null)
                    m.redraw()
                }
            )
        },

        replaceJournal() {
            if (WorkspaceView.currentJournal.itemCount() && !confirm("Replace all items with entered text for the " + WorkspaceView.journalChoice + " journal?")) return
            try {
                WorkspaceView.currentJournal.loadFromJournalText(WorkspaceView.getEditorContents())
            } catch (error) {
                WorkspaceView.toast("Problem replacing journal from editor:\n" + error)
                return
            }
            // Update lastLoadedItem.value in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedItem.value = WorkspaceView.getEditorContents()
            WorkspaceView.wasEditorDirty = false
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
            // Update lastLoadedItem.value in case pasted in contents to avoid warning later since data was processed as intended
            WorkspaceView.lastLoadedItem.value = WorkspaceView.getEditorContents()
            WorkspaceView.wasEditorDirty = false
        },

        progress(message) {
            WorkspaceView.progressMessage = message
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
        
        // This finds all extensions with the tag, runs the code for each, and returns an array of the results
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
        
        promptForContributor() {
            const contributor = prompt("Contributor? e.g. Jane Smith <jane.smith@example.com>", WorkspaceView.currentContributor)
            if (contributor !== null) {
                WorkspaceView.currentContributor = contributor
                localStorage.setItem("_contributor", contributor)
                return true
            }
            return false
        },
        
        // View functions which are composed into one big view at the end
        
        viewProgress() {
            return m(".progressDiv.fixed.top-2.left-2.pa2.fieldset.bg-light-blue.pl3.pr3.tc.o-90.z-max", 
                { hidden: !WorkspaceView.progressMessage },
                WorkspaceView.progressMessage
            )
        },
        
        viewToast() {
            return m(".toastDiv.fixed.top-2.left-2.pa2.fieldset.bg-gold.pl3.pr3.tc.o-90.z-max", 
                { hidden: WorkspaceView.toastMessages.length === 0 },
                WorkspaceView.toastMessages.length ? WorkspaceView.toastMessages[0].message : ""
            ) 
        },
        
        viewFocusAndCollapse() {
            return m("div.fr", [
                WorkspaceView.viewDirty(),
                m("span.mr2"),
                m("span.mr2", {  title: "focus mode hides extraneous editor controls to provide more space for testing" },
                    m("input[type=checkbox].ma1", { 
                        checked: WorkspaceView.focusMode,
                        onchange: (event) => WorkspaceView.focusMode = event.target.checked
                    }),
                    "focus"
                ),
                m("button.fr", { style: "min-width: 1.5rem", onclick: () => WorkspaceView.collapseWorkspace = true, title: "click here to hide the editor" }, "-"),
            ])
        },
        
        viewAbout() {
            return m("div#about.bg-lightest-blue.pa1.mb1", { style: "padding-bottom: 0.5rem" }, [
                m("a.ml2", { target: "_blank", href: "https://github.com/pdfernhout/Twirlip7" }, "Twirlip7"),
                m("div.ea-header", { style: "display: " + (WorkspaceView.focusMode ? "inline" : "none") }, [
                    m("span.ml3", { title: "Entity" }, WorkspaceView.currentItem.entity || m("span.i", "<No Entity>")),
                    m("span.ml2", "::"),
                    m("span.ml2", { title: "Attribute" }, WorkspaceView.currentItem.attribute || m("span.i", "<No Attribute>"))
                ]),
                m("div.help-header", { style: "display: " + (!WorkspaceView.focusMode ? "inline" : "none") }, [
                    m("span.ml1", "uses"),
                    m("a.ml1", { target: "_blank", href: "https://mithril.js.org/" }, "Mithril"),
                    m("a", { target: "_blank", href: "https://github.com/MithrilJS/mithril.js" }, ".js"),
                    m("a.ml2", { target: "_blank", href: "http://tachyons.io/" }, "Tachyons"),
                    m("a", { target: "_blank", href: "https://github.com/tachyons-css/tachyons/blob/master/css/tachyons.css" }, ".css"),
                    m("a.ml2", { target: "_blank", href: "https://github.com/ajaxorg/ace/wiki/Default-Keyboard-Shortcuts" }, "Ace"),
                    m("a.ml2", { target: "_blank", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" }, "JavaScript"),
                    m("span.ml2", "|"),
                    m("a.ml2", { target: "_blank", href: "https://arthurclemens.github.io/mithril-template-converter" }, "HTML->Mithril")
                ]),
                WorkspaceView.viewFocusAndCollapse(),
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
                if (!newItemId) return
                // TODO: Should have a check for "exists"
                if (WorkspaceView.currentJournal.getItem(newItemId) === null) {
                    alert("Could not find item for id:\n" + newItemId)
                } else {
                    WorkspaceView.goToKey(newItemId, {reload: true})
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
                    WorkspaceView.goToKey(newItemId, {reload: true})
                }
            }
            
            const undoManager = WorkspaceView.editor && WorkspaceView.editor.getSession().getUndoManager()
            const itemIdentifier = (WorkspaceView.currentItemId === null) ? 
                "???" : 
                ("" + WorkspaceView.currentItemId).substring(0, 12) + ((("" + WorkspaceView.currentItemId).length > 12) ? "..." : "")
            return m("div.ba.ma1",
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
                ] : []
            )
        },
        
        viewEditorMode() {
            function selectChanged(event) {
                const newEditorMode = event.target.value
                WorkspaceView.editorMode = newEditorMode
                WorkspaceView.editor.getSession().setMode(WorkspaceView.editorMode)
                WorkspaceView.currentItem.contentType = WorkspaceView.guessContentTypeForEditorMode(newEditorMode)
            }
            return m("select.ma2", { value: WorkspaceView.editorMode, onchange: selectChanged }, 
                modelist.modes.map(mode => m("option", { value: mode.mode }, mode.name))
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
                    m("input.w-80", {
                        value: WorkspaceView.currentItem.entity || "",
                        oninput: event => {
                            WorkspaceView.currentItem.entity = event.target.value
                            WorkspaceView.updateIsLastMatch()
                        },
                        onkeydown: WorkspaceView.interceptSaveKey
                    }),
                    m("button.ml1", {
                        onclick: WorkspaceView.goToLatestForEntity,
                        title: "Latest triple for Entity",
                        disabled: WorkspaceView.isLastEntityMatch
                    }, " E >|")
                ),
                m("div.ma1",
                    m("span.dib.w3.tr.mr2", "Attribute"),
                    m("input.w-80", {
                        value: WorkspaceView.currentItem.attribute || "",
                        oninput: event => {
                            WorkspaceView.currentItem.attribute = event.target.value
                            WorkspaceView.updateIsLastMatch()
                        },
                        onkeydown: WorkspaceView.interceptSaveKey
                    }),
                    m("button.ml1", {
                        onclick: WorkspaceView.goToLatestForEntityAttribute,
                        title: "Latest triple for Entity-Attribute pair",
                        disabled: WorkspaceView.isLastEntityAttributeMatch 
                    }, " EA >|")
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
                    m("input.w-40", {
                        value: WorkspaceView.currentItem.contentType || "",
                        oninput: event => WorkspaceView.currentItem.contentType = event.target.value,
                        onkeydown: WorkspaceView.interceptSaveKey
                    }),
                    m("span.pa2"),
                    m("span.dib.w4.tr.mr2", {title: "content transfer encoding like \"base64\" for binary data"}, "Encoding"),
                    m("input.w-20", {
                        value: WorkspaceView.currentItem.encoding || "",
                        oninput: event => WorkspaceView.currentItem.encoding = event.target.value,
                        onkeydown: WorkspaceView.interceptSaveKey
                    })
                ),  
                m("div.ma1",
                    m("span.dib.w4.tr.mr2", WorkspaceView.viewContributor()),
                    m("input.w-40.bg-light-gray", {
                        readonly: true,
                        value: WorkspaceView.currentItem.contributor || "",
                        oninput: event => WorkspaceView.currentItem.contributor = event.target.value,
                        onkeydown: WorkspaceView.interceptSaveKey
                    }),
                    m("span.pa2"),
                    m("span.dib.w4.tr.mr2", "Timestamp"),
                    m("input.w-20.bg-light-gray", {
                        readonly: true,
                        value: WorkspaceView.currentItem.timestamp || "",
                        oninput: event => WorkspaceView.currentItem.timestamp = event.target.value,
                        onkeydown: WorkspaceView.interceptSaveKey
                    })
                ),
                m("div.ma1",
                    m("span.dib.w4.tr.mr2", {
                        title: "click to go to item",
                        onclick: () => { if (WorkspaceView.currentItem.derivedFrom) WorkspaceView.goToKey(WorkspaceView.currentItem.derivedFrom) },
                    }, "Derived from"),
                    m("input.w-40.bg-light-gray", {
                        readonly: true,
                        value: WorkspaceView.currentItem.derivedFrom || "",
                        oninput: event => WorkspaceView.currentItem.derivedFrom = event.target.value,
                        onkeydown: WorkspaceView.interceptSaveKey
                    }),
                    m("span.pa2"),
                    m("span.dib.w4.tr.mr2", "License"),
                    m("input.w-20", {
                        value: WorkspaceView.currentItem.license || "",
                        oninput: event => WorkspaceView.currentItem.license = event.target.value,
                        onkeydown: WorkspaceView.interceptSaveKey
                    })
                )
            ]
        },
        
        viewContributor() {
            return m("span", {
                onclick: WorkspaceView.promptForContributor,
                title: "Click to set current contributor for next contribution" + (WorkspaceView.currentContributor ? "\n" + WorkspaceView.currentContributor : ""),
            }, "Contributor")
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
                        WorkspaceView.currentItem.value = WorkspaceView.getEditorContents()
                        // optimization with wasEditorDirty to prevent unneeded redraws
                        const isEditorDirty = WorkspaceView.isEditorDirty()
                        if (isEditorDirty !== WorkspaceView.wasEditorDirty) {
                            WorkspaceView.wasEditorDirty = isEditorDirty
                            WorkspaceView.updateIsLastMatch()
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
                m("button.ma1", { onclick: WorkspaceView.clear, title: "Clear out text in editor and the derivedFrom link\nPress a second time to clear other fields too" }, "Clear"),
                m("button.ma1", { onclick: WorkspaceView.importTextPlain, title: "Load a file into editor" }, "Import"),
                m("button.ma1", { onclick: WorkspaceView.importTextAsBase64, title: "Load a file into editor as base64" }, "Import as Base64"),
                m("button.ma1", { onclick: WorkspaceView.exportText, title: "Save current editor text to a file" }, "Export"),
                m("button.ma1", { onclick: WorkspaceView.displayCurrentTriple, title: "Print the current triple in the editor as a data URL (to copy)", disabled: !WorkspaceView.currentItemId }, "P*"),
                m("button.ma1", { onclick: WorkspaceView.displayCurrentTripleAndHistory, title: "Print the current triple and its entire derived-from histroy in the editor as data URLs (to copy)", disabled: !WorkspaceView.currentItemId }, "E*"),
                m("button.ma1", { onclick: WorkspaceView.readTriplesFromDataURLs, title: "Read one or more triples from data URLs in the editor (like from a paste) and save them into the current journal" }, "C*"),
            ]
        },
        
        viewBreak() {
            return m("br")
        },
        
        viewJournalButtons() {
            const journalsAvailable = WorkspaceView.journalsAvailable()
            function journalChanged(event) {
                if (!WorkspaceView.confirmClear()) {
                    return
                }
                WorkspaceView.changeJournal(event.target.value)
            }
            const isCurrentJournalLoading = WorkspaceView.journalChoice === "server" && !JournalUsingServer.isLoaded
            return [
                "Journal",
                m("select.ma2", {
                    onchange: journalChanged,
                    title: "Change storage location of snippets",
                    // The value is required here in addition to settign the options: https://gitter.im/mithriljs/mithril.js?at=59492498cf9c13503ca57fdd
                    value: WorkspaceView.journalChoice
                },
                    Object.keys(journalsAvailable).sort().map((journalKey) => {
                        let name = journalKey
                        if (journalKey === "server" && journalsAvailable[journalKey] && !JournalUsingServer.isLoaded) {
                            name += " <-->"
                        }
                        return m("option", { value: journalKey, disabled: !journalsAvailable[journalKey]}, name)
                    })
                ),
                m("button.ma1", { disabled: isCurrentJournalLoading, onclick: WorkspaceView.showCurrentJournal, title: "Put JSON for current journal contents into editor" }, "Show current journal"),
                m("button.ma1", { disabled: isCurrentJournalLoading, onclick: WorkspaceView.showExampleJournal, title: "Put a journal of sample snippets as JSON into editor (for loading afterwards)" }, "Show example journal"),
                m("button.ma1", { disabled: isCurrentJournalLoading, onclick: WorkspaceView.mergeJournal, title: "Load JSON journal from editor -- merging with the previous snippets" }, "Merge journal"),
                m("button.ma1", { disabled: isCurrentJournalLoading, onclick: WorkspaceView.replaceJournal, title: "Load JSON journal from editor -- replacing all previous snippets!" }, "Replace journal"),
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
                WorkspaceView.viewProgress(),
                WorkspaceView.viewToast(),
                WorkspaceView.viewAbout(),
                focusMode ? [] : WorkspaceView.viewExtensionsHeader(),
                focusMode ? [] : WorkspaceView.viewJournalButtons(),
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
                focusMode ? [] : WorkspaceView.viewExtensionsFooter(),
            ]
        },

        view() {
            return m("#main.ma2", [
                m("div.bg-lightest-blue.pa1.w-100", {
                    style: "padding-bottom: 0.5rem; display:" + (WorkspaceView.collapseWorkspace ? "block" : "none"),
                    onclick: () => WorkspaceView.collapseWorkspace = false,
                    title: "click here to show the editor",
                }, m("span.ml2", "Twirlip7 Editor"), m("button.fr", { style: "min-width: 1.5rem", title: "Click here to expand the editor" }, "+")),
                m("div", {
                    style: "display: " + (WorkspaceView.collapseWorkspace ? "none" : "initial")
                }, WorkspaceView.viewMain())
            ])
        },
    }
    
    return WorkspaceView
})
