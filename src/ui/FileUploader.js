// Upload a file with a sha256 name

/* global sha256 */

// defines sha256
import "./vendor/sha256.js"
const calculateSHA256 = sha256

function chunkSubstr(str, size) {
    // from: https://stackoverflow.com/questions/7033639/split-large-string-in-n-size-chunks-in-javascript/29202760#29202760
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.substr(o, size)
    }

    return chunks
}

function base64ToArrayBuffer(base64) {
    // from: https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
    const binary_string =  window.atob(base64)
    const len = binary_string.length
    const bytes = new Uint8Array( len )
    for (let i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i)
    }
    return bytes.buffer
}

const imageFileExtensions = {
    ai: true,
    bmp: true,
    gif: true,
    ico: true,
    jpg: true,
    jpeg: true,
    png: true,
    psd: true,
    svg: true,
    tif: true,
    tiff: true
}

function upload(store, filename, contents, bytes) {

    // console.log("result", filename, contents)
    // alert("upload unfinished: " + filename)
    const sha256 = calculateSHA256(bytes)
    // console.log("file info:", filename, contents, bytes, sha256)

    /*
    const uploadResponder = {
        onLoaded: () => {},
        onAddItem: (item) => {}
    }

    const upload = StoreUsingServer(m.redraw, {sha256: null}, userID)
    upload.connect(uploadResponder)
    upload.setup()
    */

    const segmentSize = 100000
    const segments = chunkSubstr(contents, 100000)
    const alternateStreamId = {sha256: sha256}
    const aField = "sha256:" + sha256

    // TODO: No error handling
    // TODO: Does not check if it exists already
    store.sendInsertItemMessage({a: aField, b: "filename", c: filename}, alternateStreamId)
    store.sendInsertItemMessage({a: aField, b: "format", c: "base64-segments"}, alternateStreamId)
    store.sendInsertItemMessage({a: aField, b: "bytes-byteLength", c: bytes.byteLength}, alternateStreamId)
    store.sendInsertItemMessage({a: aField, b: "base64-length", c: contents.length}, alternateStreamId)
    store.sendInsertItemMessage({a: aField, b: "base64-segment-count", c: segments.length}, alternateStreamId)
    store.sendInsertItemMessage({a: aField, b: "base64-segment-size", c: segmentSize}, alternateStreamId)
    
    // let reconstruct = ""
    for (let i = 0; i < segments.length; i++) {
        // console.log("sending", i + 1, "of", segments.length)
        // reconstruct += segments[i]
        store.sendInsertItemMessage({a: aField, b: "base64-segment:" + i, c: segments[i]}, alternateStreamId)
    }

    console.log("uploaded", filename, sha256)

    /* verification

    console.log("reconstruct.length", reconstruct.length)
    console.log("binary length", base64ToArrayBuffer(reconstruct).byteLength)
    */

    const sha256WithFileName = sha256 + "?filename=" + encodeURIComponent(filename)

    const extension = (filename.substr(filename.lastIndexOf(".") + 1) || "").toLowerCase()
    const isImageFile = imageFileExtensions[extension] || false

    return {
        filename,
        sha256,
        extension,
        isImageFile,
        url: "sha256/" + sha256WithFileName
    }
}

export const FileUploader = {
    upload
}