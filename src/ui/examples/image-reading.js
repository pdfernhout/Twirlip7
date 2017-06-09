// This displays a jpeg image that was imported from a file as base64.
// The file contents is stored under "The Earth seen from Apollo 17".

const imageDataBase64 = Twirlip7.findItem({entity: "The Earth seen from Apollo 17", attribute: "contents"})[0].value

Twirlip7.show(() => {
    return m("img.ma1", {src: "data:image/jpeg;charset=utf-8;base64," + imageDataBase64, alt: "The Earth seen from space by Apollo 17"})
}, ".bg-blue.br4")
