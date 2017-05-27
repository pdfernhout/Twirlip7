"use strict"

/* global require, __dirname */

// This generates exampleJournal.js as a list of examples in a specific order

const outputFileName = "../src/ui/exampleJournal.js"

const inputDirectory = "../examples/"

const inputFileNames = `
alert-hello-world.js
one-plus-one.js
my-add.js
counter-needs-reloading.js
counter-closable.js
counter-closable-styled.js
counter-component-up-down.js
show-hello.js
temperature-converter.js
simple-done-app.js
currency-converter-three.js
currency-converter-many.js
iframe-example.js
modal-dialog.js
three-3D.js
svg-example.js
svg-with-updating.js
svg-with-dragging.js
svg-multi-drag.js
draggables-extended.js
draggables-better.js
draggable-simplified.js
extension-simple.js
extension-search.js
journal-adding.js
markdown-example.md
html-example.html
fortran-example.txt
`

const fileTemplateStart = `define([], function() {
    return [`
    
const fileTemplateEnd = `
    ]  
})
`
 
const fs = require("fs")

const output = []
output.push(fileTemplateStart)

let needsLeadingComma = false

for (let fileName of inputFileNames.split("\n")) {
    if (!fileName) continue
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

// console.log(outputResult)

const realOutputFileName = fs.realpathSync(__dirname + "/" + outputFileName)

fs.writeFileSync(realOutputFileName, outputResult)

console.log("wrote", realOutputFileName)
