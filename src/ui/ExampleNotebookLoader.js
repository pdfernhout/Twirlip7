define(["CanonicalJSON"], function(CanonicalJSON) {
    "use strict"

    const exampleNotebookConfigurationFileName = "_exampleNotebookConfiguration.txt"

    const ExampleNotebookLoader = {

        loadFile(fileName) {
            const fullFileName = "vendor/text!examples/" + fileName

            return new Promise((resolve) => {
                requirejs([fullFileName], function (fileContents) {
                    resolve(fileContents)
                })
            })
        },

        loadAllFiles(progressCallback, doneCallback) {
            requirejs(["vendor/text!examples/" + exampleNotebookConfigurationFileName], function (configFileContents) {
                // console.log("configFileContents", configFileContents)
                ExampleNotebookLoader.loader(configFileContents, progressCallback, doneCallback)
            })
        },

        async loader(configFileContents, progressCallback, doneCallback) {
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

                const fileContents = await ExampleNotebookLoader.loadFile(fileName)

                item.attribute = savedAttribute || fileName
                item.value = fileContents
                output.push(CanonicalJSON.stringify(item))
            }

            doneCallback(output)
        }
    }

    return ExampleNotebookLoader
})
