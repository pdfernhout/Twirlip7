let progressMessage = null

function progress(message) {
    progressMessage = message
}

function viewProgress() {
    return m(".progressDiv.fixed.top-2.left-2.pa2.fieldset.bg-light-blue.pl3.pr3.tc.o-90.z-max",
        { hidden: !progressMessage },
        progressMessage
    )
}

export const Progress = {
    progress,
    viewProgress
}
