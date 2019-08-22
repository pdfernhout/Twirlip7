// Simple spreadsheet
// Ideas from: https://lhorie.github.io/mithril-blog/a-spreadsheet-in-60-lines-of-javascript.html

"use strict"
/* eslint-disable no-console */
/* global m, io, sha256 */

// Assumes socket.io loaded from script tag to define io

// defines m
import "./vendor/mithril.js"

// defines sha256
import "./vendor/sha256.js"
const calculateSHA256 = sha256

import NameTracker from "./NameTracker.js"

import { StreamBackendUsingServer } from "./StreamBackendUsingServer.js"

// import p from "./pointrel20171122.js"

function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

class Pointrel20190820 {
    
    constructor() {
        this.tripleIndex = {}
        this.indexedTransactions = {}
        this.latest = null

        this.redrawFunction = null
        this.currentTransaction = null

        // The "application" name is a debugging hint about what app made the transaction and why
        // use "app/method" for more details
        this.defaultApplicationName = "test"
    }

    newTransaction(application) {
        // The "application" is a debugging hint about what app made the transaction and why -- use "app/method" for more details
        if (!application) application = this.defaultApplicationName
        if (this.currentTransaction) {
            throw new Error("Transaction already in progress")
        }
        this.currentTransaction = {
            previous: undefined,
            sequence: undefined,
            application,
            triples: [],
            type: "triples"
        }
    }
    
    sendCurrentTransaction() {
        // TODO -- Faking it for now, copying a little code from processNextSend
        const transaction = this.currentTransaction
        const latest = this.getLatest()
        // const latestTransaction = latest ? await getTransactionFromCache(latest) : null
        const latestTransaction = latest ? this.indexedTransactions[latest] : null
        const sequence = latestTransaction ? latestTransaction.sequence + 1 : 0 
        transaction.previous = latest
        transaction.sequence = sequence    
        const sha256 = calculateSHA256(JSON.stringify(this.currentTransaction))
        this.addTransactionToTripleIndex(sha256, this.currentTransaction)

        console.log("TODO sendCurrentTransaction")
        // TODO: sendQueue.push(currentTransaction)
        this.currentTransaction = null
        this.setLatest(sha256)
        // TODO if (!sending) processNextSend()
    }
    
    cancelCurrentTransaction() {
        this.currentTransaction = null
    }

    addTransactionToTripleIndex(sha256, transaction) {
        if (!transaction) {
            console.log("missing transaction")
            return
        }
        if (this.indexedTransactions[sha256]) {
            console.log("transaction already indexed", sha256)
            return
        }
        if (transaction.type === "triples") {
            const triples = transaction.triples
            // Most recent triples are at end
            for (let i = triples.length - 1; i >= 0; i--) {
                const triple = triples[i]
                let aIndex = this.tripleIndex[triple.a]
                if (!aIndex) {
                    aIndex = {}
                    this.tripleIndex[triple.a] = aIndex
                }
                const bJSON = JSON.stringify(triple.b)
                let bIndex = aIndex[bJSON]
                if (!bIndex) {
                    bIndex = {c: triple.c, sequence: transaction.sequence}
                    aIndex[bJSON] = bIndex
                } else {
                    if (bIndex.sequence < transaction.sequence) {
                        bIndex.c = triple.c
                        bIndex.sequence = transaction.sequence
                    }
                }
            }
        }
        // Kludge to use memory storage
        this.indexedTransactions[sha256] = transaction
        // this.indexedTransactions[sha256] = true
    }

    getLatest() {
        return this.latest
    }
    
    setLatest(sha256) {
        this.latest = sha256
    }
    

    setDefaultApplicationName(name) {
        this.defaultApplicationName = name
    }

    uuidv4() {
        return uuidv4()
    }

    findC(a, b) {
        /*
        // first check any pending transactions -- most recent are at end
        for (let queueIndex = sendQueue.length - 1; queueIndex >= 0; queueIndex--) {
            const transaction = sendQueue[queueIndex]
            if (transaction.type === "triples") {
                const triples = transaction.triples
                // Most recent triples are at end
                for (let i = triples.length - 1; i >= 0; i--) {
                    const triple = triples[i]
                    if (triple.a === a && triple.b === b) return triple.c
                }
            }
        }
        */
    
        // console.log("this.tripleIndex", this.tripleIndex)
        const aIndex = this.tripleIndex[a]
        if (aIndex) {
            const bJSON = JSON.stringify(b)
            const bIndex = aIndex[bJSON]
            if (bIndex) return bIndex.c
        }
    
        return undefined
    }
    
    addTriple(a, b, c) {
        console.log("addTriple", a, b, c)
    
        const triple = {a, b, c}
    
        if (this.currentTransaction) {
            this.currentTransaction.triples.push(triple)
        } else {
            this.newTransaction()
            this.currentTransaction.triples.push(triple)
            this.sendCurrentTransaction()
        }
    }

    // setId is optional
    findBC(a, setId) {
        const result = {}

        /*
        // first check any pending transactions -- most recent are at end
        for (let queueIndex = sendQueue.length - 1; queueIndex >= 0; queueIndex--) {
            const transaction = sendQueue[queueIndex]
            if (transaction.type === "triples") {
                const triples = transaction.triples
                // Most recent triples are at end
                for (let i = triples.length - 1; i >= 0; i--) {
                    const triple = triples[i]
                    const bJSON = JSON.stringify(triple.b)
                    if (triple.a === a && result[bJSON] === undefined) {
                        if (!setId || triple.b[setId]) {
                            result[bJSON] = triple.c
                        }
                    }
                }
            }
        }
        */

        const aIndex = this.tripleIndex[a]
        if (aIndex) {
            const keys = Object.keys(aIndex)
            for (let bJSON of keys) {
                if (result[bJSON] === undefined) {
                    if (!setId || JSON.parse(bJSON)[setId]) {
                        result[bJSON] = aIndex[bJSON].c
                    }
                }
            }
        }

        return result
    }

    isOffline() {
        // console.log("TODO isOffline")
        return false
    }

    isLoaded() {
        // console.log("TODO isLoaded")
        return true
    }
    
    getLastSequenceRead() {
        console.log("TODO getLastSequenceRead")
        return 0
    }

    setRedrawFunction(f) {
        this.redrawFunction = f
    }

    setShareName(shareName) {
        console.log("TODO setShareName")
    }

    updateFromStorage(repeatDelay) {
        console.log("TODO updateFromStorage")
    }
}

const p = new Pointrel20190820()

p.setDefaultApplicationName("tables")

const nameTracker = new NameTracker({
    hashNameField: "name",
    displayNameLabel: "Name",
    defaultName: "tables-test",
    nameChangedCallback: startup
})

function getTablesName() {
    if (!nameTracker.name || nameTracker.name === "tables") return "tables"
    return "tables:" + nameTracker.name
}

const showFormulasForTable = {}

class Table {
    constructor(uuid) {
        this.uuid = uuid || p.uuidv4()
    }

    getName() {
        return p.findC(this.uuid, "name") || ""
    }

    setName(name) {
        p.addTriple(this.uuid, "name", name)
    }

    getWidth() {
        return p.findC(this.uuid, "width") || 5
    }

    setWidth(width) {
        width = parseInt(width)
        if (!width) return
        width = Math.max(1, width)
        width = Math.min(26, width)
        p.addTriple(this.uuid, "width", width)
    }

    getHeight() {
        return p.findC(this.uuid, "height") || 10
    }

    setHeight(height) {
        p.addTriple(this.uuid, "height", height)
    }

    getShowFormulas() {
        // return p.findC(this.uuid, "showFormulas") || false
        return showFormulasForTable[this.uuid]
    }

    setShowFormulas(showFormulas) {
        // p.addTriple(this.uuid, "showFormulas", showFormulas)
        showFormulasForTable[this.uuid] = showFormulas
    }

    getCell(x, y) {
        return p.findC(this.uuid, JSON.stringify({x: x, y: y})) || ""
    }

    setCell(x, y, contents) {
        if (this.getCell(x, y) !== contents) {
            p.addTriple(this.uuid, JSON.stringify({x: x, y: y}), contents)
        }
    } 
    
    getColumnWidth(x) {
        return p.findC(this.uuid, JSON.stringify({columnWidth: x})) || 8
    }

    setColumnWidth(x, value) {
        value = Math.max(2, value)
        p.addTriple(this.uuid, JSON.stringify({columnWidth: x}), value)
    } 
}   

class TablesApplication {
    getTables() {
        const result = []
        const bcMap = p.findBC(getTablesName(), "table")
        for (let key in bcMap) {
            const uuid = bcMap[key]
            if (uuid) result.push(new Table(uuid))
        }
        return result
    }

    addTable(table) {
        p.addTriple(getTablesName(), {table: table.uuid}, table.uuid)
    }

    deleteItem(table) {
        p.addTriple(getTablesName(), {table: table.uuid}, null)
    }

    getTableForName(name) {
        const tables = this.getTables()
        for (let table of tables) {
            if (table.getName() === name) return table
        }
        return null
    }
}

let tablesApplication = new TablesApplication()

function makeNewTable() {
    const name = prompt("New table name? e.g. electric")
    if (!name) return
    const table = new Table()
    table.setName(name)
    tablesApplication.addTable(table)
}

let focusedCell = {tableName: "", row: 0, column: 0}

let lastCellCopiedFrom = null
let lastTextCopied = ""

// TODO: This could mess up strings with cell refs in them
// This is imited to basic math for non-space seprtaed cell refs.
// Other cell refs need to be separated from operators by spaces.
// (\+|-|\*|\/|\(|\)| |$)
const cellRefRegex = /(^| |=|\+|-|\*|\/|\(|\))(\$?)([a-z]+)(\$?)([0-9]+)/g

function displayTable(table) {
    const width = table.getWidth()
    const height =  table.getHeight()

    // To prevent and report circular references
    let cellsRequired = {}
    let cellsResult = {}
    let cellHasError = false

    function evalFormula(textToEval) {
        // Replace cell ref strings with function calls
        textToEval = textToEval.replace(cellRefRegex, "$1cell(\"$3$5\")")
        return eval(textToEval)
    }

    // cell can be used within spreadsheet
    /* eslint-disable-next-line no-unused-vars */
    // Recursive via eval
    function cell(cellName, tableName) {
        const t = tableName ? tablesApplication.getTableForName(tableName) : table
        if (!t) throw new Error("No table named: " + tableName)

        const [discard0, discard1, discard2, letter, discard3, number] = new RegExp(cellRefRegex).exec(cellName)
        const c = letter.charCodeAt(0) - "a".charCodeAt(0)
        const r = parseInt(number) - 1

        return cell_(t, c, r)
    }

    function cell_(t, c, r) {

        const cellRefJSON = JSON.stringify({tableName: t.getName(), c, r})
        if (cellsResult[cellRefJSON] !== undefined) {
            return cellsResult[cellRefJSON]
        }
        if (cellsRequired[cellRefJSON]) throw new Error("Circular reference: " + cellRefJSON)
        cellsRequired[cellRefJSON] = true
        
        let contents = t.getCell(c, r)
        let result
        if (contents.startsWith("=")) {
            let textToEval = contents.substring(1)
            try {
                result = evalFormula(textToEval)
            } catch (e) {
                console.log("Error in cell", e)
                result = "#REF!"
                cellHasError = true
            }
        } else {
            if (!isNaN(contents)) {
                result = parseFloat(contents)
            } else {
                result = contents
            }
        }
        cellsResult[cellRefJSON] = result
        return result
    }

    function _(cellName, tableName) {
        return cell(cellName, tableName)
    }

    function setWidth(column) {
        let newWidth = prompt("New column width (2-80)", table.getColumnWidth(column))
        if (!newWidth) return
        newWidth = parseInt(newWidth)
        if (newWidth < 2) newWidth = 2
        if (newWidth > 80) newWidth = 80
        table.setColumnWidth(column, newWidth)
    }

    function getSelection(element) {
        return element.value.slice(element.selectionStart, element.selectionEnd)
    }

    function updateTextForPasteInNewLocation(text, from, to) {
        const dx = to.column - from.column
        const dy = to.row - from.row
        
        return text.replace(cellRefRegex, (match, leader, absoluteLetter, letter, absoluteNumber, number) => {
            if (!absoluteLetter) {
                if (letter.length > 1) {
                    console.log("only one character cell references supported yet")
                    letter = "#REF!"
                } else {
                    const newLetterIndex = letter.charCodeAt(0) + dx
                    if (newLetterIndex >= "a".charCodeAt(0) && newLetterIndex <= "z".charCodeAt(0)) {
                        letter = String.fromCharCode(newLetterIndex)
                    } else {
                        letter = "#REF!"
                    }
                }
            }
            if (!absoluteNumber) {
                number = parseInt(number) + dy
                if (number < 1) {
                    number = "#REF!"
                }
            }
            return leader + absoluteLetter + letter + absoluteNumber + number
        })
    }

    function cells() {
        const rows = []

        let headers = []
        headers.push(m("th.bg-moon-gray.bb.w2"))
        for (let column = 0; column < width; column++) {
            const theColumn = column
            const letter = String.fromCharCode("a".charCodeAt(0) + column)
            headers.push(m("th.bg-moon-gray.pa1.bl.bb.br", {
                onclick: () => setWidth(theColumn),
            }, letter))
        }
        rows.push(m("tr", headers))

        for (let row = 0; row < height; row++) {
            const columns = []
            columns.push(m("th.bg-moon-gray.bb.br", "" + (row + 1)))
            for (let column = 0; column < width; column++) {
                const enteredText = table.getCell(column, row)
                let displayText = enteredText
                cellHasError = false
                if (!table.getShowFormulas() && enteredText.startsWith("=") && (focusedCell.tableName !== table.getName() || focusedCell.column !== column || focusedCell.row !== row)) {
                    try {
                        cellsRequired = {}
                        displayText = cell_(table, column, row)
                    } catch (e) {
                        displayText = enteredText
                        cellHasError = true
                        console.log("Error", e)
                    }
                }
                columns.push(m("td.pa1.br.bb", m("input.bw0" + (cellHasError ? ".orange" : ""), {
                    style: {
                        textAlign: isNaN(displayText) || displayText === "" ? "left" : "right",
                        width: table.getColumnWidth(column) + "rem"
                    },
                    onkeydown: (event) => {
                        if (event.keyCode === 13) {
                            table.setCell(column, row, event.target.value)
                            return
                        }
                        event.redraw = false
                    },
                    onfocus: () => focusedCell = {tableName: table.getName(), column: column, row: row },
                    value: displayText, 
                    onchange: event => table.setCell(column, row, event.target.value),
                    oncopy: (e) => {
                        event.redraw = false
                        table.setCell(column, row, event.target.value)
                        lastCellCopiedFrom = {row, column}
                        lastTextCopied = getSelection(e.target)
                    },
                    oncut: (e) => {
                        event.redraw = false
                        table.setCell(column, row, event.target.value)
                        lastCellCopiedFrom = {row, column}
                        lastTextCopied = getSelection(e.target)
                    },
                    onpaste: (e) => {
                        table.setCell(column, row, event.target.value)
                        event.redraw = false

                        // Get pasted data via clipboard API
                        const clipboardData = e.clipboardData || window.clipboardData
                        const pastedData = clipboardData.getData("Text")

                        if (pastedData === lastTextCopied) {
                            const updatedText = updateTextForPasteInNewLocation(pastedData, lastCellCopiedFrom, {row, column})
                            document.execCommand("insertText", false, updatedText)
                            // Stop data from being pasted into div by event by returning false
                            return false
                        }
                    }
                })))
            }
            rows.push(m("tr", columns))
        }

        return m("table.collapse", m("tbody", rows))
    }

    return m("div.mt3.mb3", {key: table.uuid}, [
        m("div", 
            m("span.b.f2", table.getName()),
            m("label.ml2", "columns:",
                m("input.ml1.w2", {value: width, onchange: (event) => table.setWidth(event.target.value)}),
            ),
            m("label.ml2", "rows:",
                m("input.ml1.w2", {value:height, onchange: (event) => table.setHeight(event.target.value)}),
            ),
            m("input[type=checkbox].ml3.mr1", {checked: table.getShowFormulas(), onchange: () => table.setShowFormulas(!table.getShowFormulas())}),
            "show formulas"
        ),
        cells()
    ])
}

function displayTables() {
    const tables = tablesApplication.getTables()
    return m("div.ma1", [
        tables.reverse().map((table) => {
            return displayTable(table)
        }),
        m("div.mt1", [
            m("button", { onclick: () => makeNewTable() }, "New Table"),
        ])
    ])
}

const TablesViewer = {
    view: function() {
        const result = m(".main.ma1", [
            p.isOffline() ? m("div.h2.pa1.ba.b--red", "OFFLINE", m("button.ml1", { onclick: p.goOnline }, "Try to go online")) : [],
            nameTracker.displayNameEditor(),
            p.isLoaded() ?
                displayTables() :
                "Loading... " + (p.getLastSequenceRead() || "")
        ])
        return result
    }
}

async function startup() {
    p.setRedrawFunction(m.redraw)
    p.setShareName(getTablesName())
    await p.updateFromStorage(true)
    m.redraw()
}

m.mount(document.body, TablesViewer)

startup()
