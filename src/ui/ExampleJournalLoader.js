define(["CanonicalJSON"], function(CanonicalJSON) {
    "use strict"

    const exampleJournalConfigurationFileName = "_exampleJournalConfiguration.txt"

    const ExampleJournalLoader = {
        
        it: null,

        loadFile(fileName) {
            const fullFileName = "vendor/text!examples/" + fileName
            // console.log("reading", fullFileName)
            requirejs([fullFileName], function (fileContents) {
                ExampleJournalLoader.it.next(fileContents)
            })
        },
        
        loadAllFiles(progressCallback, doneCallback) {
            requirejs(["vendor/text!examples/" + exampleJournalConfigurationFileName], function (configFileContents) {
                // console.log("configFileContents", configFileContents)
                ExampleJournalLoader.it = ExampleJournalLoader.loader(configFileContents, progressCallback, doneCallback)
                ExampleJournalLoader.it.next()
            }) 
        },
        
        // Use generator to keep code looking like blocking node.js version: https://davidwalsh.name/async-generators
        *loader(configFileContents, progressCallback, doneCallback) {
            const inputLines = configFileContents.split("\n")
            
            const output = []
            
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
            
            let savedAttribute = ""
            
            for (let i = 0; i < inputLines.length; i++) {
                const inputLine = inputLines[i]
                progressCallback("Processing line " + (i + 1) + " of " + inputLines.length)
                if (!inputLine) continue
                if (inputLine.startsWith("//")) continue
                if (inputLine.startsWith("{")) {
                    const defaultProperties = JSON.parse(inputLine)
                    for (let key in defaultProperties) {
                        if (key === "attribute") {
                            // treat attribute special so we know if we can use file name instead
                            savedAttribute = defaultProperties[key]
                        } else {
                            item[key] = defaultProperties[key]
                        }
                    }
                    continue
                }
                const fileName = inputLine.trim()
                
                // An interator for a generator makes this file load operation look synchronous even though it is asynchronous
                const fileContents = ExampleJournalLoader.loadFile(fileName)
                
                item.attribute = savedAttribute || fileName
                item.value = fileContents
                output.push(CanonicalJSON.stringify(item))
            }
            
            doneCallback(output)
        }
    }

    return ExampleJournalLoader
})
