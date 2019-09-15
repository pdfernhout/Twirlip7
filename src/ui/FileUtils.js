"use strict"

// Conversion function from: http://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
function _arrayBufferToBase64(buffer) {
    let binary = ""
    const bytes = new Uint8Array(buffer)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
}

export const FileUtils = {
    // This fileControl input node is not created via main Mithril app because stand-alone apps might want to use this too
    fileControl: null,

    // Define a changeable global callback as will be making one re-used file control that uses it
    callback: null,

    loadFromFile(convertToBase64, callback) {
        // support first argument being either a callback or a flag
        if (typeof convertToBase64 === "function") {
            callback = convertToBase64
            convertToBase64 = false
        }
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
                reader.onload = function() {
                    let contents
                    if (convertToBase64) {
                        var base64Text = _arrayBufferToBase64(reader.result)
                        contents = base64Text
                    } else {
                        contents = reader.result
                    }

                    if (FileUtils.callback) FileUtils.callback(file.name, contents, reader.result)
                }

                reader.onerror = function(event) {
                    console.error("File could not be read! Code " + event.target.error.code)
                    if (FileUtils.callback) FileUtils.callback(null, null)
                }

                if (convertToBase64) {
                    reader.readAsArrayBuffer(file)
                } else {
                    reader.readAsText(file)
                }
            }, false)
        }

        FileUtils.callback = callback
        FileUtils.fileControl.click()
    },

    saveToFile(provisionalFileName, fileContents, hiddenExtension, callback) {
        let fileName = prompt("Please enter a file name for saving", provisionalFileName)
        if (!fileName) return

        let addedExtension = false
        if (hiddenExtension && !fileName.endsWith(hiddenExtension)) {
            fileName = fileName + hiddenExtension
            addedExtension = true
        }

        const downloadLink = document.createElement("a")
        downloadLink.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileContents))
        downloadLink.setAttribute("download", fileName)
        downloadLink.style.display = "none"
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        if (addedExtension) {
            // remove the extension we added
            fileName = fileName.substring(0, fileName.length - hiddenExtension.length)
        }
        if (callback) callback(fileName)
    }
}
