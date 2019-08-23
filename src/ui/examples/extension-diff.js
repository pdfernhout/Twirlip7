// Extend the application with diff functionality
// Ace editor differ code from: https://github.com/benkeen/ace-diff

/* global require, diff_match_patch */

// Stylesheet modified from: https://github.com/benkeen/ace-diff/blob/master/demos/demo2/styles.css
const aceDiffStyleSheet = 
`#flex-container {
    display: flex;
    display: -webkit-flex;
    flex-direction: row;
    position: relative;
    bottom: 0;
    width: 100%;
    top: 0px !important;
    left: 0px;

    /* these 3 lines are to prevents an unsightly scrolling bounce affect on Safari */
    height: 100%;
    width: 100%;
    overflow: auto;
}
#flex-container>div {
    flex-grow: 1;
    -webkit-flex-grow: 1;
    position: relative;
}
#flex-container>div#gutter {
    flex: 0 0 60px;
    -webkit-flex: 0 0 60px;
    border-left: 1px solid #999999;
    border-right: 1px solid #999999;
    background-color: #efefef;
    overflow: hidden;
}
#gutter svg {
    background-color: #efefef;
}
#editor1 {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
}
#editor2 {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
}
.acediff-diff {
    background-color: #d8f2ff;
    border-top: 1px solid #a2d7f2;
    border-bottom: 1px solid #a2d7f2;
    position: absolute;
    z-index: 4;
}
.acediff-diff.targetOnly {
    height: 0px !important;
    border-top: 1px solid #a2d7f2;
    border-bottom: 0px;
    position: absolute;
}
.acediff-connector {
    fill: #d8f2ff;
    stroke: #a2d7f2;
}

.acediff-copy-left {
    float: right;
}
.acediff-copy-right,
.acediff-copy-left {
    position: relative;
}
.acediff-copy-right div {
    color: #000000;
    text-shadow: 1px 1px #ffffff;
    position: absolute;
    margin: -3px 2px;
    cursor: pointer;
}
.acediff-copy-right div:hover {
    color: #004ea0;
}
.acediff-copy-left div {
    color: #000000;
    text-shadow: 1px 1px #ffffff;
    position: absolute;
    right: 0px;
    margin: -3px 2px;
    cursor: pointer;
}
.acediff-copy-left div:hover {
    color: #c98100;
}
#flex-container {
    height: 400px;
}`
    
function addAceDiffStylesheetIfNeeded() {
    if (!document.getElementById("aceDiffStyleSheet")) {
        const sheet = document.createElement("style")
        sheet.innerHTML = aceDiffStyleSheet
        sheet.id = "aceDiffStyleSheet"
        document.body.appendChild(sheet)
    }
}
  
addAceDiffStylesheetIfNeeded()
    
function cleanupAceDiffer() {
    if (window.aceDiffer) {
        window.aceDiffer.destroy()
        window.aceDiffer = undefined
    }
}

// ace-diff generates an error related to modules which can be ignored for now
// TODO: Get this to work with the latest library version in ace-diff folder
require(["vendor/diff_match_patch", "vendor/ace-diff.js"], function(discard, AceDiff) {
    
    cleanupAceDiffer()
    
    let earlierItemKey = ""
    let earlierText = ""
    let laterItemKey = ""
    let laterText = ""
    let editorMode = "ace/mode/javascript"
    
    function earlierClicked() {
        earlierItemKey = Twirlip7.notebookView.getCurrentItemId()
        earlierText = Twirlip7.notebookView.getEditorContents()
        editorMode = Twirlip7.notebookView.getEditorMode()
        makeAceDiffer()
    }
    
    function laterClicked() {
        laterItemKey = Twirlip7.notebookView.getCurrentItemId()
        laterText = Twirlip7.notebookView.getEditorContents()
        editorMode = Twirlip7.notebookView.getEditorMode()
        makeAceDiffer()
    }
    
    function makeAceDifferForTwoItems(earlierItem, laterItem) {
        earlierText = (earlierItem && earlierItem.value) || ""
        laterText = (laterItem && laterItem.value) || ""
        editorMode = Twirlip7.notebookView.getEditorMode()
        makeAceDiffer()
    }

    function diffClicked() {
        if (Twirlip7.notebookView.isEditorDirty()) {
            earlierItemKey = Twirlip7.notebookView.getCurrentItemId()
            try {
                const earlierItemText = Twirlip7.getCurrentNotebook().getItem(earlierItemKey)
                const earlierItem = Twirlip7.getItemForJSON(earlierItemText)
                
                laterItemKey = "<editor>"
                const laterItem = { value: Twirlip7.notebookView.getEditorContents() }
                makeAceDifferForTwoItems(earlierItem, laterItem)
                m.redraw()
            } catch(error) {
                console.log("Problem loading item", error)
            }
        } else {
            laterItemKey = Twirlip7.notebookView.getCurrentItemId()
            try {
                const laterItemText = Twirlip7.getCurrentNotebook().getItem(laterItemKey)
                const laterItem = Twirlip7.getItemForJSON(laterItemText)
                earlierItemKey = laterItem.derivedFrom || ""
                const earlierItemText = Twirlip7.getCurrentNotebook().getItem(earlierItemKey)
                const earlierItem = Twirlip7.getItemForJSON(earlierItemText)
                makeAceDifferForTwoItems(earlierItem, laterItem)
                m.redraw()
            } catch(error) {
                console.log("Problem loading item", error)
            }
        }
    }
    
    function makeAceDiffer() {
        cleanupAceDiffer()
        const aceDiffer = new AceDiff({
            mode: editorMode,
            left: {
                id: "editor1",
                content: earlierText
            },
            right: {
                id: "editor2",
                content: laterText
            },
            classes: {
                gutterID: "gutter"
            }
        })
        window.aceDiffer = aceDiffer
    }
    
    Twirlip7.notebookView.extensionsInstall({
        id: "diff",
        tags: "footer",
        code: () => {
            return m("div.mt1",
                m("button", { onclick: diffClicked }, "Diff from " + (Twirlip7.notebookView.isEditorDirty() ? "saved" : "previous") + " version"),
                m("button.ml2", { onclick: cleanupAceDiffer }, "Hide Diff"),
                m("button.ml2", { onclick: makeAceDiffer }, "Show Diff"),
                m("button.ml2", { onclick: earlierClicked, title: earlierItemKey }, "Earlier"),
                m("button.ml2", { onclick: laterClicked, title: laterItemKey }, "Later"),
                m("#flex-container.mt2.mb2",
                    [
                        m("div",
                            m("#editor1")
                        ),
                        m("[#gutter"),
                        m("div",
                            m("#editor2")
                        )
                    ]
                )
            )
        }
    })
    
    // Need to redraw since the install happens in an asynchronous require
    m.redraw()

    // Twirlip7.notebookView.extensionsUninstall({id: "diff"})
})
