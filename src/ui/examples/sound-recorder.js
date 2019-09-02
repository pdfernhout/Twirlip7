// Sound recorder
// Inspired by example at: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
// Reload the page in Firefox to get the microphone warning to go away

const soundClips = []
let chunks = []
let mediaRecorder

function setup() {
    if (!navigator.mediaDevices) {
        alert("media not supported in this browser")
        return
    }
    
    const constraints = { audio: true }
    return navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        mediaRecorder = new MediaRecorder(stream)
        mediaRecorder.ondataavailable = onRecorderData
        mediaRecorder.onstop = onRecorderStop
        console.log("state", mediaRecorder.state)
        m.redraw()
    }).catch(function(err) {
        console.log("An error occurred: " + err)
    })
}

function recordClick() {
    mediaRecorder.start()
    console.log("recorder started")
    console.log("state", mediaRecorder.state)
}

function stopClick() {
    mediaRecorder.stop()
    console.log("recorder stopped")
    console.log("state", mediaRecorder.state)
}

function onRecorderData(e) {
    chunks.push(e.data)
    console.log("added chunk", chunks.length)
    m.redraw()
}

function onRecorderStop(e) {
    console.log("stop called")
    
    console.log("chunks", chunks)
    
    const blob = new Blob(chunks, { "type" : "audio/ogg; codecs=opus" })
    chunks = []
    const audioURL = URL.createObjectURL(blob)
    console.log("audioURL", audioURL)
    soundClips.push(audioURL)
    console.log("recorder stopped")
    m.redraw()
}

setup()

Twirlip7.show(() => {
    return (!mediaRecorder)
        ? m("div", "Starting up media recorder")
        : m("div",
            m("div", "Chunk count: " + chunks.length),
            m("button.bg-red.pa2.br4", { onclick: recordClick, disabled: mediaRecorder.state === "recording" }, "Record"),
            m("button.bg-red.pa2.br4", { onclick: stopClick, disabled: mediaRecorder.state !== "recording" }, "Stop"),
            soundClips.map(audioURL =>
                m("article", 
                    m("audio", {controls: true, src: audioURL})
                )
            )
        )
}, ".bg-blue.br4")
