// Currency Converter Demo For Three Currencies

const minPrecision = 0
const maxPrecision = 9

const conversionRatesToDollars = {
    dollars: 1.0,
    pounds: 0.69,
    euros: 0.9
}

const model = {
    amount: "100.00",
    currency: "dollars",
    precision: "2",
    currencyError: false,
    precisionError: false
}

function setPrecision(event) {
    let precision = event.target.value
    model.precision = "" + precision
    if (getPrecision() !== parseInt(model.precision)) {
        model.precisionError = true
    } else {
        model.precisionError = false
    }
}

function getPrecision() {
    const precision = parseInt(model.precision)
    if (isNaN(precision)) return 0
    if (precision < minPrecision) return minPrecision
    else if (precision > maxPrecision) return maxPrecision
    return precision
}
    
function setCurrencyValue(currency, event) {
    const newValue =  event.target.value
    model.currency = currency
    model.amount = newValue
    model.currencyError = isNaN(parseFloat(newValue))
}

const inputDollars = setCurrencyValue.bind(null, "dollars")
const inputEuros = setCurrencyValue.bind(null, "euros")
const inputPounds = setCurrencyValue.bind(null, "pounds")

function getCurrencyValue(currency) {
    if (model.currency === currency) { return model.amount }
    
    // convert currency
    const amount = parseFloat(model.amount)
    const dollarAmount = amount * conversionRatesToDollars[model.currency]
    const result = dollarAmount / conversionRatesToDollars[currency]
    if (isNaN(result)) {
        return "???"
    }
    return "" + result.toFixed(getPrecision())
}

Twirlip7.show(() => {
    let borderColorClass = ".b--green"
    if (model.precisionError) borderColorClass = ".b--yellow"
    if (model.currencyError) borderColorClass = ".b--red"
    
    return m("div.br4.bw3.b--solid" + borderColorClass, [
        "Currency Converter For Three Currencies",
        m("div", [
            "Precision: ",
            m("input.w3", { value: "" + model.precision, oninput: setPrecision, type: "number" })
        ]),
        m("hr"),
        m("div", [
            m("span.label.dib.w4.tr.ma1", "US Dollars"),
            m("input", { value: getCurrencyValue("dollars"), oninput: inputDollars } )
        ]),
        m("div", [
            m("span.label.dib.w4.tr.ma1", "Euros"),
            m("input", { value: getCurrencyValue("euros"), oninput: inputEuros } )
        ]),
        m("div", [
            m("span.label.dib.w4.tr.ma1", "Pounds"),
            m("input", { value: getCurrencyValue("pounds"), oninput: inputPounds } )
        ])
    ])
})
