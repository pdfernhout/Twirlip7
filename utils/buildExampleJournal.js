"use strict"

/* global require, __dirname */

// This generates exampleJournal.js as a list of examples in a specific order
// A configuration file defines the files to include and the order

const inputDirectory = "../examples/"
const exampleJournalConfigurationFileName = "_exampleJournalConfiguration.txt"
const outputFileName = "../src/ui/exampleJournal.js"

const fileTemplateStart = `// This file should not be edited by hand; it is generated using "npm buildExampleJournal" 
define([], function() {
    return [`
    
const fileTemplateEnd = `
    ]  
})
`
 
const fs = require("fs")

const inputFileNames = fs.readFileSync(__dirname + "/" + inputDirectory + exampleJournalConfigurationFileName).toString().split("\n")

const output = []
output.push(fileTemplateStart)

let needsLeadingComma = false

for (let fileName of inputFileNames) {
    if (!fileName) continue
    if (fileName.startsWith("//")) continue
    const fullFileName = fs.realpathSync(__dirname + "/" + inputDirectory + fileName)
    console.log("reading", fullFileName)
    const fileContents = fs.readFileSync(fullFileName).toString()
    if (needsLeadingComma) output.push(",")
    needsLeadingComma = true
    output.push("\n")
    output.push("        ")
    output.push(JSON.stringify(fileContents))
}

output.push(fileTemplateEnd)

const outputResult = output.join("")

const realOutputFileName = fs.realpathSync(__dirname + "/" + outputFileName)

fs.writeFileSync(realOutputFileName, outputResult)

console.log("wrote", realOutputFileName)
