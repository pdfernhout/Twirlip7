define(["CanonicalJSON"], function(CanonicalJSON) {
    "use strict"

    const exampleNotebookConfigurationFileName = "_exampleNotebookConfiguration.txt"

    const ExampleNotebookLoader = {
        
        it: null,

        loadFile(fileName) {
            const fullFileName = "vendor/text!examples/" + fileName
            requirejs([fullFileName], function (fileContents) {
                ExampleNotebookLoader.it.next(fileContents)
            })
        },
        
        loadAllFiles(progressCallback, doneCallback) {
            requirejs(["vendor/text!examples/" + exampleNotebookConfigurationFileName], function (configFileContents) {
                // console.log("configFileContents", configFileContents)
                ExampleNotebookLoader.it = ExampleNotebookLoader.loader(configFileContents, progressCallback, doneCallback)
                ExampleNotebookLoader.it.next()
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
                progressCallback("Loading line " + (i + 1) + " of " + inputLines.length)
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
                const fileContents = yield ExampleNotebookLoader.loadFile(fileName)
                
                item.attribute = savedAttribute || fileName
                item.value = fileContents
                output.push(CanonicalJSON.stringify(item))
            }
            
            doneCallback(output)
        }
    }

    return ExampleNotebookLoader
})
