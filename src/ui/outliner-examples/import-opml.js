// Importer code for OPML converted to JSON
/* eslint-disable no-console */
/* global p */

// OPML is an file format for outlines encoded in XML.

// This reads in outlines in that format if they have been converted to JSON first
// using a tool like: http://www.utilities-online.info/xmltojson/
// where attributes are converted to entries prefixed by "-" as in "-text".

// This code can be evaluated in the outliner -- after you copy and paste it into a node there.

// This was tested on OPML for Doug Englebart's Hyperscope, specifically "finalarch.opml"
// retrievable by: $ wget http://codinginparadise.org/hyperscope/src/demos/finalarch.opml

// Before using this, you need to evaluate something to be "window.opmlExample" as a global,
// evaluated in a node there, as in: window.opmlExample = { ... } 

console.log("==================== OPML Importer")

function repeat(str, times) {
    return new Array(times + 1).join(str)
}

function makeNewNode(contents, parent) {
    const node = new Node(p.uuidv4())
    node.setContents(contents)
    node.setParent(parent.uuid)
    parent.addChild(node.uuid)
    return node
}

function displayOutline(item, level, parent, lead) {
    // console.log("item", item)
    if (!item) return
    lead = lead || ""
    const text = lead + (item["-text"] || "[NO TEXT]")
    console.log(repeat("    ", level), text)
    const node = makeNewNode(text, parent)
    const outline = item.outline
    if (outline) {
        if (outline instanceof Array) {
            const extraSpace = (item.outline.length > 9) ? " " : ""
            for (let i = 0; i < item.outline.length; i++) {
                const itemLead = ((i + 1) < 10 ? extraSpace : "") + (i + 1) + ". "
                displayOutline(item.outline[i], level + 1, node, itemLead)
            }
        } else {
            displayOutline(outline, level + 1, node, "")
        }
    }
}

p.newTransaction("import-opml")
try {
    displayOutline(window.opmlExample.opml.body, 0, root, "")
    p.sendCurrentTransaction()
} catch (e) {
    p.cancelCurrentTransaction()
}

console.log("=== DONE")
