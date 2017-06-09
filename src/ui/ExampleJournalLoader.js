define(["CanonicalJSON"], function(CanonicalJSON) {
    "use strict"

    const exampleJournalConfigurationFileName = "_exampleJournalConfiguration.txt"

    const ExampleJournalLoader = {
        
        it: null,

        loadFile(fileName, callback) {
            requirejs(["vendor/text!examples/" + fileName], function (fileContents) {
                callback(fileContents)
            })
        },
        
        loadAllFiles(callback) {
            requirejs(["vendor/text!examples/" + exampleJournalConfigurationFileName], function (configFileContents) {
                // console.log("configFileContents", configFileContents)
                ExampleJournalLoader.it = ExampleJournalLoader.loader(configFileContents, callback)
                ExampleJournalLoader.it.next()
            }) 
        },
        
        // Use generator to keep code looking like blocking node.js version: https://davidwalsh.name/async-generators
        *loader(configFileContents, callback) {
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
            
            for (let inputLine of inputLines) {
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
                const fullFileName = "vendor/text!examples/" + fileName
                // console.log("reading", fullFileName)
                
                const fileContents = yield requirejs([fullFileName], function (fileContents) {
                    ExampleJournalLoader.it.next(fileContents)
                }) 
                
                item.attribute = savedAttribute || fileName
                item.value = fileContents
                output.push(CanonicalJSON.stringify(item))
            }
            
            callback(output)
        }
    }

    return ExampleJournalLoader
})
