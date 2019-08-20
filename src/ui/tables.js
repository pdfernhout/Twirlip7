"use strict"
/* eslint-disable no-console */

// Simple spreadsheet
// Ideas from: https://lhorie.github.io/mithril-blog/a-spreadsheet-in-60-lines-of-javascript.html

import NameTracker from "./NameTracker.js"
import p from "./pointrel20171122.js"
import m from "./mithril.v1.1.6.js"

p.setDefaultApplicationName("tables")

const nameTracker = new NameTracker({
    hashNameField: "name",
    displayNameLabel: "Name",
    defaultName: "tables",
    nameChangedCallback: startup
})

function getTablesName() {
    if (!nameTracker.name || nameTracker.name === "tables") return "tables"
    return "tables:" + nameTracker.name
}

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
        return p.findC(this.uuid, "width") || 1
    }

    setWidth(width) {
        width = parseInt(width)
        if (!width) return
        width = Math.max(1, width)
        width = Math.min(26, width)
        p.addTriple(this.uuid, "width", width)
    }

    getHeight() {
        return p.findC(this.uuid, "height") || 1
    }

    setHeight(height) {
        p.addTriple(this.uuid, "height", height)
    }

    getShowFormulas() {
        return p.findC(this.uuid, "showFormulas") || false
    }

    setShowFormulas(showFormulas) {
        p.addTriple(this.uuid, "showFormulas", showFormulas)
    }

    getCell(x, y) {
        return p.findC(this.uuid, JSON.stringify({x: x, y: y})) || ""
    }

    setCell(x, y, contents) {
        p.addTriple(this.uuid, JSON.stringify({x: x, y: y}), contents)
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

function displayTable(table) {
    const width = table.getWidth()
    const height =  table.getHeight()

    // To prevent and report circular references
    let cellsEvaled = {}
    let cellHasError = false

    // cell can be used within spreadsheet
    /* eslint-disable-next-line no-unused-vars */
    function cell(cellName, tableName) {
        const t = tableName ? tablesApplication.getTableForName(tableName) : table
        if (!t) throw new Error("No table named: " + tableName)

        if (cellsEvaled[JSON.stringify({cellName, tableName})]) throw new Error("Circular reference: " + cellName)
        cellsEvaled[JSON.stringify({cellName, tableName})] = true

        const c = cellName[0].charCodeAt(0) - "a".charCodeAt(0)
        const r = parseInt(cellName[1]) - 1
        let result = t.getCell(c, r)
        // console.log("cell,result", cellName, result, c, r)

        if (result.startsWith("=")) {
            try {
                result = eval(result.substring(1))
            } catch (e) {
                console.log("Error in cell", e)
                cellHasError = true
            }
        }
        return result
    }

    function setWidth(column) {
        let newWidth = prompt("New column width (2-80)", table.getColumnWidth(column))
        if (!newWidth) return
        newWidth = parseInt(newWidth)
        if (newWidth < 2) newWidth = 2
        if (newWidth > 80) newWidth = 80
        table.setColumnWidth(column, newWidth)
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
                        cellsEvaled = {}
                        displayText = eval(enteredText.substring(1))
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
                    onchange: event => table.setCell(column, row, event.target.value)
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
