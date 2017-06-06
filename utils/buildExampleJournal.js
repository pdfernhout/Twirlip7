"use strict"

/* global require, __dirname */

// This generates exampleJournal.js as a list of examples in a specific order
// A configuration file defines the files to include and the order

const inputDirectory = "../examples/"
const exampleJournalConfigurationFileName = "_exampleJournalConfiguration.txt"
const outputFileName = "../src/ui/exampleJournal.js"

const fileTemplateStart = `// This file should not be edited by hand; it is generated using "npm run buildExampleJournal" 
define([], function() {
    return [`
    
const fileTemplateEnd = `
    ]  
})
`
 
const fs = require("fs")

const inputLines = fs.readFileSync(__dirname + "/" + inputDirectory + exampleJournalConfigurationFileName).toString().split("\n")

const output = []
output.push(fileTemplateStart)

let needsLeadingComma = false

const item = {
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

for (let inputLine of inputLines) {
    if (!inputLine) continue
    if (inputLine.startsWith("//")) continue
    if (inputLine.startsWith("{")) {
        const defaultProperties = JSON.parse(inputLine)
        for (let key in defaultProperties) {
            item[key] = defaultProperties[key]
        }
        continue
    }
    const fileName = inputLine.trim()
    const fullFileName = fs.realpathSync(__dirname + "/" + inputDirectory + fileName)
    console.log("reading", fullFileName)
    const fileContents = fs.readFileSync(fullFileName).toString()
    item.attribute = fileName
    item.value = fileContents
    if (needsLeadingComma) output.push(",")
    needsLeadingComma = true
    output.push("\n")
    output.push("        ")
    // TODO: Should canonicalize JSON
    output.push(JSON.stringify(JSON.stringify(item)))
}

output.push(fileTemplateEnd)

const outputResult = output.join("")

const realOutputFileName = fs.realpathSync(__dirname + "/" + outputFileName)

fs.writeFileSync(realOutputFileName, outputResult)

console.log("wrote", realOutputFileName)
