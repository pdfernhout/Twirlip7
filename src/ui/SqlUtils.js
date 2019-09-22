// Parse and display SQL insert statements which define a set of tables.
// This was created originally to support reading in a SQL file from Compendium.
// The file is assumed to be exported in utf8.
// There may be character encoding issues otherwise (and were for that Compendium file).

/* Example SQL this can parse including ignoring non-INSERT lines (the first and blanks):
DATABASE TYPE = DERBY :2.0.1
INSERT INTO System (Property, Contents) VALUES ('version','2.0.1')
INSERT INTO System (Property, Contents) VALUES ('defaultuser','1270111357180684958')
INSERT INTO System (Property, Contents) VALUES ('codegroup','')

INSERT INTO NodeCode (NodeID, CodeID) VALUES ('1270111357737538597','1270111357189822105')
INSERT INTO NodeCode (NodeID, CodeID) VALUES ('1270111357737538597','1270111357465898521')
*/

"use strict"

function parseSection(tokens, text) {
    if (!text) return tokens
    if (text[0] !== "'") {
        // number
        const token = text.split(",")[0]
        tokens.push(parseInt(token))
        return parseSection(tokens, text.substring(token.length + 1))
    }
    // Quoted string -- need to detect end while skipping double quotes
    let end = 0
    for (let i = 1; i < text.length; i++) {
        if (text[i] === "'") {
            if (text[i+1] === "'") {
                // skip escaped quote
                i++
            } else {
                end = i
                break
            }
        }
    }
    if (end) {
        const token = text.substring(1, end).replace(/''/g, "'")
        tokens.push(token)
        // skip quote and following comma
        return parseSection(tokens, text.substring(end + 2))
    }
    console.log("problem parsing ", text)
    return tokens
}

function parseSQLInsertStatement(tables, line) {
    const regex = /INSERT INTO (\w*) \(([^)]*)\) VALUES (.*)/
    const match = line.match(regex)
    if (!match) return null
    const tableName = match[1]
    const fieldNames = match[2].split(", ")
    const valuesString = match[3]
    const values = []
    parseSection(values, valuesString.substring(1, valuesString.length - 1))
    
    if (fieldNames.length !== values.length) throw new Error("agreement problem parsing: " + line)

    const row = {}

    for (let i = 0; i < fieldNames.length; i++) {
        row[fieldNames[i]] = values[i]
    }

    if (!tables[tableName]) tables[tableName] = []
    tables[tableName].push(row)
}

function parseSqlIntoTables(sqlText) {
    const tables = {}
    const lines = sqlText.split("\n")
    for (let line of lines) {
        parseSQLInsertStatement(tables, line)
    }
    return tables
}

const expandTable = {}

function viewSqlTables(tables) {
    const result = []

    function header(table) {
        const row = table[0]
        const keys = Object.keys(row).sort()
        return keys.map(key => m("th", key))
    }

    for (let tableName of Object.keys(tables).sort()) {
        result.push(
            m("div",
                m("h3", 
                    tableName, 
                    m("span.ml2", {
                        onclick: () => expandTable[tableName] = !expandTable[tableName]
                    }, expandTable[tableName] ? "▾" : "▸" )
                ),
                expandTable[tableName] && m("table.ml3",
                    m("thead",
                        m("tr.stripe-dark",
                            header(tables[tableName])
                        )
                    ),
                    m("tbody",
                        tables[tableName].map(row => {
                            const keys = Object.keys(row).sort()

                            return m("tr.stripe-dark", keys.map(key => {
                                let value = row[key]
                                let truncated = false
                                if (key.endsWith("Date")) value = new Date(value).toISOString()
                                value = "" + value
                                let untruncatedValue = value
                                untruncatedValue = untruncatedValue.replace(/\\n/g, "\n")
                                if (value.length > 80) {
                                    value = value.substring(0, 77)
                                    truncated = true
                                }
                                return m("td.pa1", {
                                    title: tableName + ":" + key + (truncated ? " -- click to see more" : "")
                                }, truncated 
                                    ? m("span", {onclick: () => alert(untruncatedValue)}, value, m("b", "..."))
                                    : value
                                )
                            }))
                        })
                    )
                )
            )
        )
        result.push(m("hr"))
    }
    return result
}

export const SqlUtils = {
    parseSqlIntoTables,
    viewSqlTables
}