// Temperature converter

let temperature_F
let temperature_C

function inputF(event) {
    temperature_F = event.target.value
    if (temperature_F.trim() === "") { temperature_C = ""; return }
    temperature_C = "" + ((parseFloat(temperature_F) - 32) * 5 / 9)
}

function inputC(event) {
    temperature_C = event.target.value
    if (temperature_C.trim() === "") { temperature_F = ""; return }
    temperature_F = "" + (parseFloat(temperature_C) * 9 / 5 + 32)
}

Twirlip7.show(() => {
    return m("div", [
        "Fahrenheight",
        m("input.ma2", { value: temperature_F, oninput: inputF }),
        "Celcius",
        m("input.ma2", { value: temperature_C, oninput: inputC })
    ])
}, ".bg-blue.br4")
