define([], function() {
    "use strict"

    const FileUtils = {
        // Requires fileInput node somewhere:
        // m("input#fileInput", { "type" : "file" , "hidden" : true } )

        loadFromFile(callback) {
            const fileControl = document.getElementById("fileInput")
            fileControl.addEventListener("change", function (event) {
                if (event.target.files.length < 1) return
                const file = event.target.files[0]
                const reader = new FileReader()
                reader.onload = function(event) {
                    const contents = event.target.result
                    callback(file.name, contents)
                }
                
                reader.onerror = function(event) {
                    console.error("File could not be read! Code " + event.target.error.code)
                    callback(null, null)
                }
                
                reader.readAsText(file)
            }, false)
            fileControl.click()
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