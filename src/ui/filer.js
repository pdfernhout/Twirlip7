"use strict"
/* eslint-disable no-console */

// defines m
import "./vendor/mithril.js"

import NameTracker from "./NameTracker.js"

import { Pointrel20190820 } from "./Pointrel20190820.js"

const p = new Pointrel20190820()
p.setDefaultApplicationName("filer")

async function startup() {
    p.setShareName("fileSystem:test")
    p.setRedrawFunction(m.redraw)
    await p.updateFromStorage(true)
    if (!p.getLatestSHA256()) {
        p.newTransaction()
        p.addTriple("root", "fileName", "root")
        p.addTriple("root", "isDir", "true")
        p.sendCurrentTransaction()
        m.redraw()
    }
}

class Node {

    constructor(uuid) {
        this.uuid = uuid
    }

    get contents() {
        return p.findC(this.uuid, "contents")
    }

    set contents(contents) {
        p.addTriple(this.uuid, "contents", contents)
    }

    get fileName() {
        return p.findC(this.uuid, "fileName")
    }

    set fileName(fileName) {
        p.addTriple(this.uuid, "fileName", fileName)
    }

    // This is a copy of files, so any changes to files need to be resaved
    get files() {
        if (!this.isDir) return null
        const result = []
        const bcMap = p.findBC(this.uuid, "file")
        for (let key in bcMap) {
            const uuid = bcMap[key]
            if (uuid) result.push(uuid)
        }
        return result
    }

    set files(files) {
        throw Error("files can not be set")
    }

    get isDir() {
        return JSON.parse(p.findC(this.uuid, "isDir") || "false")
    }

    set isDir(isDir) {
        p. addTriple(this.uuid, "isDir", JSON.stringify(isDir))
    }

    get parent() {
        return p.findC(this.uuid, "parent")
    }

    set parent(parent) {
        p.addTriple(this.uuid, "parent", parent)
    }

    makeNodesForFiles() {
        const files = this.files
        if (!files) return null
        return files.map(uuid => new Node(uuid))
    }

    addFile(uuid) {
        p.addTriple(this.uuid, {file: uuid}, uuid)
    }

    deleteFile(uuid) {
        p.addTriple(this.uuid, {file: uuid}, null)
    }
}

const root = new Node("root")

function addNode(parentNode, isDir) {
    const fileName = prompt("name?")
    if (fileName) {
        p.newTransaction()
        const node = new Node(p.uuidv4())
        node.fileName = fileName
        node.parent = parentNode.uuid
        node.isDir = isDir
        parentNode.addFile(node.uuid)
        p.sendCurrentTransaction()
    }
}

function deleteNode(node, parentNode) {
    const ok = confirm("delete "+ node.fileName + "?")
    if (ok) {
        p.newTransaction()
        parentNode.deleteFile(node.uuid)
        node.parent = ""
        p.sendCurrentTransaction()
    }
}

function editNode(node) {
    const contents = prompt("contents?", node.contents)
    if (contents || contents === "") {
        // No transaction needed as single change
        node.contents = contents
    }
}

function renameNode(node) {
    const fileName = prompt("new name?", node.fileName)
    if (fileName) {
        // No transaction needed as single change
        node.fileName = fileName
    }
}

const expandedNodes = {}

function expandNode(uuid) {
    expandedNodes[uuid] = !expandedNodes[uuid]
}

const parentStack = []

let showPopup = ""

function makePopup(uuid, content) {
    return [
        m("span.ml1.mr1.f3.b", 
            {
                onclick: () => {
                    showPopup === uuid ? 
                        showPopup = "" :
                        showPopup = uuid
                }
            },
            "..."
        ),
        showPopup === uuid ? m("div.dib", content) : []
    ]
}

// Recursive
function displayFile(node) {

    function deleteButton() {
        return m("button.ml1.f7", {onclick: deleteNode.bind(null, node, parentStack[0])}, "Delete")
    }

    function editButton() {
        return m("button.ml1.f7", {onclick: editNode.bind(null, node)}, "Edit")
    }

    function renameButton() {
        return m("button.ml1.f7", {onclick: renameNode.bind(null, node)}, "Rename")
    }

    function compareFileNames(a, b) {
        const aFileName = a.fileName || ""
        const bFileName = b.fileName || ""
        return aFileName.localeCompare(bFileName)
    }

    if (node === null) return "NULL"
    const files = node.makeNodesForFiles()
    if (files) {
        parentStack.unshift(node)
        const sortedFiles = files.sort(compareFileNames).map(node => {
            return [displayFile(node)]
        })
        parentStack.shift()
        const expanded = expandedNodes[node.uuid]
        return m(".directory.ml3.mt1.mb1", { key: "node:" + node.uuid }, [
            m("span.mr1", { onclick: () => expandNode(node.uuid) }, expanded ? "▾" : "▸"),
            node.fileName,
            makePopup(node.uuid, [
                (node.uuid === "root") ? [] : [renameButton(), deleteButton()],
                expanded ? [
                    m("button.ml1.f7", {onclick: addNode.bind(null, node, false)}, "Add File"),
                    m("button.ml1.f7", {onclick: addNode.bind(null, node, "isDir")}, "Add Directory")
                ] : [(node.uuid !== "root") ? [] : m("button.ml1.f7", {onclick: () => expandNode(node.uuid)}, "Expand")]
            ])
        ].concat(expanded ? 
            sortedFiles.length ? sortedFiles : [m("br"), m("span.ml3", "EMPTY")] : 
            []
        ))
    } else {
        return m(".file.ml3.mt1.mb1", { key: "node:" + node.uuid }, [
            node.fileName,
            makePopup(node.uuid, [
                renameButton(),
                deleteButton(),
                editButton()
            ])
        ])
    }
}

const FileSystemViewer = {
    view: function() {
        return m(".main", [
            m("h1.ba.b--blue", { class: "title" }, "Test Virtual Files"),
            p.isOffline() ? m("div.h2.pa1.ba.b--red", "OFFLINE", m("button.ml1", {onclick: p.goOnline }, "Try to go online")) : [],
            p.isLoaded() ?
                m("div", displayFile(root)) :
                "Loading..."
        ])
    }
}

m.mount(document.body, FileSystemViewer)

startup()
