// Simple spreadsheet
// Ideas from: https://lhorie.github.io/mithril-blog/a-spreadsheet-in-60-lines-of-javascript.html

"use strict"
/* eslint-disable no-console */

// defines m
import "./vendor/mithril.js"

import NameTracker from "./NameTracker.js"

import { Pointrel20190820 } from "./Pointrel20190820.js"

const p = new Pointrel20190820()

p.setDefaultApplicationName("tables")

const nameTracker = new NameTracker({
    hashNameField: "name",
    displayNameLabel: "Name",
    defaultName: "test",
    nameChangedCallback: startup
})

function getTablesName() {
    if (!nameTracker.name || nameTracker.name === "tables") return "tables:test"
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
// This is limited to basic math for non-space separated cell refs.
// Other cell refs need to be separated from operators by spaces.
const cellRefRegex = /(^| |=|\+|-|\*|\/|\(|\))(\$?)([a-z]+)(\$?)([0-9]+)/g

function displayTable(table) {
    const width = table.getWidth()
    const height =  table.getHeight()

    // To prevent and report circular references
    let cellsRequired = {}
    let cellsResult = {}
    let cellHasError = false
    let currentTable = table

    function evalFormula(textToEval) {
        // Replace cell ref strings with function calls
        textToEval = textToEval.replace(cellRefRegex, "$1cell(\"$3$5\")")
        return eval(textToEval)
    }

    // cell can be used within spreadsheet
    // Recursive via eval
    function cell(cellName, tableName) {
        const t = tableName ? tablesApplication.getTableForName(tableName) : currentTable
        currentTable = t
        if (!t) throw new Error("No table named: " + tableName)

        const [discard0, discard1, discard2, letter, discard3, number] = new RegExp(cellRefRegex).exec(cellName)
        const c = letter.charCodeAt(0) - "a".charCodeAt(0)
        const r = parseInt(number) - 1

        return cell_(t, c, r)
    }

    function cell_(t, c, r) {
        currentTable = t

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
                        lastCellCopiedFrom = {row, column}
                        lastTextCopied = getSelection(e.target)
                    },
                    oncut: (e) => {
                        event.redraw = false
                        lastCellCopiedFrom = {row, column}
                        lastTextCopied = getSelection(e.target)
                    },
                    onpaste: (e) => {
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
    tables.sort((a, b) => ("" + a.getName() + " |" + a.uuid).localeCompare(b.getName() + " |" + b.uuid))
    return m("div.ma1", [
        tables.map((table) => {
            return displayTable(table)
        }),
        m("div.mt1", [
            m("button", { onclick: () => makeNewTable() }, "New Table"),
        ])
    ])
}

const TablesViewer = {
    view: function() {
        // console.log("p.getLatestSequence() ", p.getLatestSequence(),  p.isOffline())
        const result = m(".main.ma1", [
            p.isOffline() ? m("div.h2.pa1.ba.b--red", "OFFLINE", m("button.ml1", { onclick: p.goOnline }, "Try to go online")) : [],
            nameTracker.displayNameEditor(),
            p.isLoaded() ?
                displayTables() :
                "Loading... " + (p.getLatestSequence() || "")
        ])
        return result
    }
}

async function startup() {
    p.setRedrawFunction(m.redraw)
    p.setStreamId(getTablesName())
    await p.updateFromStorage()
    m.redraw()
}

m.mount(document.body, TablesViewer)

startup()
