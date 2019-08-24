"use strict"
/* eslint-disable no-console */

import p from "./pointrel20171122.js"
import m from "./mithril.v1.1.6.js"
import NameTracker from "./NameTracker.js"

p.setDefaultApplicationName("outliner")

const menuButtonWithStyle = "button.ma1.f7"

const nameTracker = new NameTracker({
    nameChangedCallback: startup
})

function getOutlinerName() {
    return "outliner:" + nameTracker.name
}

async function startup() {
    // preserve copiedNodeRepresentation but clear cutNode as node triple data is in a different outline
    cutNode = null

    p.setShareName(getOutlinerName())
    m.redraw()
    p.setRedrawFunction(m.redraw)
    await p.updateFromStorage(true)
    m.redraw()
}

function firstLine(text) {
    if (!text) return ""
    return text.split("\n")[0]
}

class Node {

    constructor(uuid) {
        this.uuid = uuid
    }

    getContents() {
        return p.findC(this.uuid, "contents") || ""
    }

    setContents(contents) {
        p.addTriple(this.uuid, "contents", contents)
    }

    getFirstLine() {
        return firstLine(this.getContents())
    }

    getRestOfLines() {
        const contents = this.getContents()
        return contents.substring(firstLine(contents).length + 1)
    }

    isContentsMultiLine() {
        const contents = this.getContents()
        return firstLine(contents) !== contents
    }

    // This is a copy of children, so any changes to children need to be resaved
    getChildrenAsUUIDs() {
        const result = []
        const bcMap = p.findBC(this.uuid, "child")
        for (let key in bcMap) {
            const uuid = bcMap[key]
            if (uuid) result.push(uuid)
        }
        return result
    }

    getChildrenAsNodes() {
        const uuidsForChildren = this.getChildrenAsUUIDs()
        if (!uuidsForChildren) return null
        return uuidsForChildren.map(uuid => new Node(uuid))
    }

    getParent() {
        return p.findC(this.uuid, "parent")
    }

    setParent(parent) {
        p.addTriple(this.uuid, "parent", parent)
    }

    addChild(uuid) {
        p.addTriple(this.uuid, {child: uuid}, uuid)
        // new Node(uuid).setParent(this.uuid)
    }

    deleteChild(uuid) {
        p.addTriple(this.uuid, {child: uuid}, null)
    }
}

const root = new Node("root")

function addNode(parentNode) {
    const contents = prompt("contents?")
    if (contents) {
        p.newTransaction("outliner/addNode")
        const node = new Node(p.uuidv4())
        node.setContents(contents)
        node.setParent(parentNode.uuid)
        parentNode.addChild(node.uuid)
        p.sendCurrentTransaction()
    }
}

function deleteNode(node) {
    console.log("DeleteNode", node)
    const ok = true // confirm("cut " + node.getFirstLine() + "?")
    if (ok) {
        p.newTransaction("outliner/deleteNode")
        const parent = node.getParent()
        if (parent) {
            new Node(parent).deleteChild(node.uuid)
            node.setParent("")
        }
        p.sendCurrentTransaction()
    }
    return ok
}

const expandedNodes = {}
const expandedTexts = {}

function expandNode(node) {
    const uuid = node.uuid
    expandedNodes[uuid] = !expandedNodes[uuid]
}

function expandAllChildren(node) {
    const uuid = node.uuid
    if (expandedNodes[uuid]) {
        setExpanded(node, false)
    } else {
        setExpanded(node, true)
    }
}

// Recursive
function setExpanded(node, state) {
    const children = node.getChildrenAsNodes()

    let childMatch = false
    for (const child of children) {
        childMatch = setExpanded(child, state) || childMatch
    }

    if (filterText) {
        const contents = node.getContents()
        const re = new RegExp(filterText, "i")
        if (childMatch || re.test(contents)) {
            expandedNodes[node.uuid] = state
            expandedTexts[node.uuid] = state
            return true
        } else {
            expandedNodes[node.uuid] = false
            expandedTexts[node.uuid] = false
            return false
        }
    } else {
        expandedNodes[node.uuid] = state
        expandedTexts[node.uuid] = state
        return true
    }
}

// Recursive
function copyNodeRepresentation(node) {
    const newNode = { 
        uuid: node.uuid,
        contents: node.getContents(),
        children: node.getChildrenAsNodes().map(child => copyNodeRepresentation(child))
    }

    return newNode
}

// Recursive
function recreateNode(nodeRepresentation, parentNode) {
    const node = new Node(p.uuidv4())
    node.setContents(nodeRepresentation.contents)
    node.setParent(parentNode.uuid)
    parentNode.addChild(node.uuid)
    for (const childRepresentation of nodeRepresentation.children) {
        recreateNode(childRepresentation, node)
    }
    return node
}

let showPopup = ""

let editedNode = ""
let cutNode = null
let copiedNodeRepresentation = null

let filterText = ""

// Recursive
function displayNode(node) {

    function showButton() {
        return m(menuButtonWithStyle, {
            onclick: () => {
                expandedTexts[node.uuid] = !expandedTexts[node.uuid]
                editedNode = ""
            }
        }, "Show")
    }

    function editButton() {
        return m(menuButtonWithStyle, { 
            onclick: () => {
                (editedNode === node.uuid) ?
                    editedNode = "" :
                    editedNode = node.uuid
                expandedTexts[node.uuid] = false
            }
        }, "Edit")
    }

    function evalButton() {
        return m(menuButtonWithStyle, { 
            onclick: () => {
                evalNodeContents(node)
            }
        }, "Eval")
    }

    function evalNodeContents(node) {
        const contents = node.getContents()
        eval(contents)
    }

    function cutButton() {
        return m(menuButtonWithStyle, {
            disabled: node.uuid === "root",
            onclick: () => {
                if (deleteNode(node)) {
                    cutNode = node
                    copiedNodeRepresentation = copyNodeRepresentation(node)
                }
            }
        }, "Cut")
    }

    function copyButton() {
        return m(menuButtonWithStyle, {
            onclick: () => {
                cutNode = null
                copiedNodeRepresentation = copyNodeRepresentation(node)   
            }
        }, "Copy")
    }

    function pasteChildButton() {
        return m(menuButtonWithStyle, { 
            disabled: !cutNode && !copiedNodeRepresentation,
            onclick: () => {
                if (cutNode) {
                    p.newTransaction("outliner/cutNode")
                    node.addChild(cutNode.uuid)
                    cutNode.setParent(node.uuid)
                    p.sendCurrentTransaction()
                    cutNode = null
                    copiedNodeRepresentation = null
                } else if (copiedNodeRepresentation) {
                    p.newTransaction("outliner/pasteNode")
                    recreateNode(copiedNodeRepresentation, node)
                    p.sendCurrentTransaction()
                }
            }
        }, "Paste Child")
    }

    function compareNodeNames(a, b) {
        const aNodeName = a.getFirstLine() || ""
        const bNodeName = b.getFirstLine() || ""
        return aNodeName.localeCompare(bNodeName)
    }

    if (node === null) return "NULL"
    const children = node.getChildrenAsNodes()

    const isMultiLine = node.isContentsMultiLine()
    const isExpandable = children.length !== 0
    const isExpanded = isExpandable && expandedNodes[node.uuid]

    let sortedNodes = []
    if (isExpanded || filterText) {
        // As optimization, only calculate display for children if the node is expanded or filtering
        sortedNodes = children.sort(compareNodeNames).map(node => {
            return displayNode(node)
        })
        sortedNodes = sortedNodes.filter(item => !Array.isArray(item) || item.length !== 0)
    }

    let isContentMatch = false
    if (filterText) {
        const contents = node.getContents()
        const re = new RegExp(filterText, "i")
        isContentMatch = re.test(contents)
        if (!isContentMatch && !sortedNodes.length) return []
    }

    return m("div.ml3.mt1.mb1", { key: "node:" + node.uuid }, [
        isExpandable ? m("span.mr1.dib", {
            onclick: () => {
                expandNode(node)
                showPopup = ""
                editedNode = ""
            },
            style: "min-width: 0.5rem"
        }, isExpanded ? "▾" : "▸") : [m("span.mr1.dib", { style: "min-width: 0.5rem" }, "•")],
        m("span" + (isContentMatch ? ".b" : ""), 
            { 
                onclick: () => {
                    showPopup === node.uuid ? showPopup = "" : showPopup = node.uuid
                    editedNode = ""
                }
            },
            node.getFirstLine() || "[EMPTY]",
        ),
        isMultiLine ?  
            m("span.b", {
                onclick: () => {
                    expandedTexts[node.uuid] = !expandedTexts[node.uuid]
                    editedNode = ""
                }
            }, expandedTexts[node.uuid] ? m("span", { style: "visibility: hidden" }, " ...") : " ...") :
            [],
        showPopup === node.uuid ?
            // Use relative div inside absolute div so we can move popup meny up slightly
            m("div.dib.absolute", m("div.relative.bg-light-yellow.ml1", { style: "top: -0.30rem" }, [
                isMultiLine ? showButton() : [],
                editButton(),
                evalButton(),
                copyButton(),
                (node.uuid === "root") ? [] : cutButton(),
                pasteChildButton(),
                m(menuButtonWithStyle, {onclick: addNode.bind(null, node, false)}, "Add Child"),
                isExpandable
                    ? [
                        m(menuButtonWithStyle, {onclick: () => expandNode(node)}, "Expand"),
                        m(menuButtonWithStyle, {onclick: () => expandAllChildren(node)}, "Expand All"),
                    ]
                    : []
            ])) : 
            [],
        (editedNode === node.uuid) ? [
            m("br"),
            m("textarea", { rows: 10, cols: 60,  value: node.getContents(), onchange: (event) => node.setContents(event.target.value) })
        ] : (isMultiLine && expandedTexts[node.uuid]) ? 
            m("div.ml3", { style: "white-space: pre-wrap" }, node.getRestOfLines()) :
            []

    ].concat(isExpanded ? 
        sortedNodes.length ? sortedNodes : [] : 
        []
    ))
}

/*
function displayFormattetText(text) {
    const lines = text.split(/\r?\n/g)
    return lines.map(line => [line, m("br")])
}
*/

function displayOutliner() {
    return m("outliner", [
        m("div.ma2", [
            "Filter:",
            m("input.w6.ml1.mr1", { value: filterText, onchange: (event) => filterText = event.target.value } ),
            "(regex)",
            m("button.ml1", { onclick: () => expandAllChildren(root) }, "Expand All")
        ]),
        displayNode(root)
    ])
}

const NodeSystemViewer = {
    view: function() {
        return m(".main", [
            m("h1.ba.b--blue", { class: "title" }, "Twirlip9 Outliner"),
            p.isOffline() ? m("div.h2.pa1.ba.b--red", "OFFLINE", m("button.ml1", {onclick: p.goOnline }, "Try to go online")) : [],
            nameTracker.displayNameEditor(),
            p.isLoaded() ?
                displayOutliner() :
                "Loading..."
        ])
    }
}

m.mount(document.body, NodeSystemViewer)

startup()
