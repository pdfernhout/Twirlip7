// Extend the application with diff functionality
// See: https://github.com/benkeen/ace-diff

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
require(["vendor/diff_match_patch_uncompressed", "vendor/ace-diff"], function(discard, AceDiff) {
    
    cleanupAceDiffer()
    
    function diffClicked() {
        console.log("diffClicked")
        cleanupAceDiffer()
        
        const laterItemText = Twirlip7.getCurrentJournal().getItem(Twirlip7.WorkspaceView.currentItemId)
        const laterItem = JSON.parse(laterItemText)
        const earlierItemKey = laterItem.derivedFrom || ""
        const earlierItemText = Twirlip7.getCurrentJournal().getItem(earlierItemKey)
        const earlierItem = JSON.parse(earlierItemText)
        const editorMode = Twirlip7.WorkspaceView.editorMode
        
        window.aceDiffer = makeAceDiffer(earlierItem.value, laterItem.value, editorMode)
    }
    
    // TODO: Handle destroying this differ and not having two or more if reinstall
    function makeAceDiffer(earlierText, laterText, editorMode) {
        return new AceDiff({
            mode: editorMode || "ace/mode/javascript",
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
    }
    
    Twirlip7.WorkspaceView.extensionsInstall({
        id: "diff",
        tags: "footer",
        code: (context) => {
            return m("div",
                m("button", { onclick: diffClicked }, "Diff from previous version"),
                m("button.ml2", { onclick: cleanupAceDiffer }, "Hide Diff"),
                m("#flex-container",
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
    
    // setTimeout(() => window.aceDiffer = makeAceDiffer(), 100)
    
    // Twirlip7.WorkspaceView.extensionsUninstall({id: "diff"})
})
