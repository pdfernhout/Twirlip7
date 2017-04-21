define([], function() {
    "use strict"

    const Selecter = {
        
        getSelection(id, returnAllForNoSelection) {
            const textArea = document.getElementById(id)
            const start = textArea.selectionStart
            const end = textArea.selectionEnd
            const text = textArea.value.substring(start, end)
            if (returnAllForNoSelection) {
                if (start === end) {
                    return {
                        start: 0,
                        end: textArea.value.length,
                        text: textArea.value
                    }
                }
            }
            return {
                start,
                end,
                text
            }
        },

        selectRange(id, start, end) {
            const textArea = document.getElementById(id)
            textArea.focus()
            textArea.selectionStart = start
            textArea.selectionEnd = end
        }
    }

    return Selecter
})