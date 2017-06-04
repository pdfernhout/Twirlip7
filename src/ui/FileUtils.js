define([], function() {
    "use strict"

    const FileUtils = {
        // This fileControl input node is not created via main Mithril app because stand-alone apps might want to use this too
        fileControl: null,

        callback: null,

        loadFromFile(callback) {
            if (!FileUtils.fileControl) {
                const fileControl = document.createElement("input")
                FileUtils.fileControl = fileControl
                fileControl.type = "file"
                fileControl.style = "display: none"
                document.body.appendChild(FileUtils.fileControl)

                fileControl.addEventListener("change", function (event) {
                    if (event.target.files.length < 1) return
                    const file = event.target.files[0]
                    const reader = new FileReader()
                    reader.onload = function(event) {
                        const contents = event.target.result
                        if (FileUtils.callback) FileUtils.callback(file.name, contents)
                    }
                    
                    reader.onerror = function(event) {
                        console.error("File could not be read! Code " + event.target.error.code)
                        if (FileUtils.callback) FileUtils.callback(null, null)
                    }
                    
                    reader.readAsText(file)
                }, false)
            }

            FileUtils.callback = callback
            FileUtils.fileControl.click()
        },

        saveToFile(provisionalFileName, fileContents) {
            console.log("saveToFile")
            const fileName = prompt("Please enter a file name for saving", provisionalFileName)
            if (!fileName) return
            
            console.log("saving", fileName)
            const downloadLink = document.createElement("a")
            downloadLink.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileContents))
            downloadLink.setAttribute("download", fileName)
            downloadLink.style.display = "none"
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
            console.log("done saving", fileName)
        }
    }

    return FileUtils
})