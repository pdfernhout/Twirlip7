const toastMessages = []

function toast(message, delay) {
    function removeToastAfterDelay() {
        setTimeout(function() {
            toastMessages.shift()
            if ( toastMessages.length ) { removeToastAfterDelay() }
            m.redraw()
        }, toastMessages[0].delay)
    }
    if (delay === undefined) { delay = 3000 }
    toastMessages.push({message, delay})
    if ( toastMessages.length === 1) { removeToastAfterDelay() }
}

function viewToast() {
    return m(".toastDiv.fixed.top-2.left-2.pa2.fieldset.bg-gold.pl3.pr3.tc.o-90.z-max",
        { hidden: toastMessages.length === 0 },
        toastMessages.length ? toastMessages[0].message : ""
    )
}

export const Toast = {
    toast,
    viewToast
}