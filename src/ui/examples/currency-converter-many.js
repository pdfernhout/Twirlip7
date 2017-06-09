// Currency Converter Demo for many currencies

const minPrecision = 0
const maxPrecision = 9

/*
interface CurrencyRate {
    name: string
    symbol: string
    dollarsPerUnit: number
    unitsPerDollar: number
}
*/

const allRates = { }

const rateValueSetters = { }

const model = {
    amount: "100.00",
    currency: "USD",
    precision: "2",
    currencyError: false,
    precisionError: false
}

function loadAllRates() {
    for (let line of ratesAsCSV().split("\n")) {
        const parts = line.split(",")
        const currencyRate = {
            name: parts[0],
            symbol: parts[1],
            dollarsPerUnit: parseFloat(parts[2]),
            unitsPerDollar: parseFloat(parts[3])
        }
        allRates[currencyRate.symbol] = currencyRate
        rateValueSetters[currencyRate.symbol] = setCurrencyValue.bind(null, currencyRate.symbol)
    }
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

function getCurrencyValue(currency) {
    if (model.currency === currency) { return model.amount }

    // convert currency
    const currencyRate = allRates[currency]
    const amount = parseFloat(model.amount)
    const dollarAmount = amount * allRates[model.currency].dollarsPerUnit
    const result = dollarAmount * allRates[currency].unitsPerDollar
    if (isNaN(result)) {
        return "???"
    }
    return "" + result.toFixed(getPrecision())
}

loadAllRates()

Twirlip7.show(() => {
    let borderColorClass = ".b--green"
    if (model.precisionError) borderColorClass = ".b--yellow"
    if (model.currencyError) borderColorClass = ".b--red"
    
    return m("div.br4.bw3.b--solid" + borderColorClass, { id: "currency-converter" }, [
        m(".pa3.f3", "Currency Converter"),
        m("div.ml3", [
            "Precision: ",
            m("input.w3", { value: "" + model.precision, oninput: setPrecision, type: "number" })
        ]),
        m("hr"),
        Object.keys(allRates).map(function (key) {
            const currencyRate = allRates[key]
            return m("div", [
                m("span.label.dib.tr.w5.mr2", currencyRate.name + " (" + currencyRate.symbol + ")"),
                m("input.w4", {
                    value: getCurrencyValue(currencyRate.symbol),
                    oninput: rateValueSetters[currencyRate.symbol]
                })
            ])
        })
    ])
})

// Rates on 2016-05-31 from https://www.oanda.com/currency

// Currency,Code,USD/1 Unit,Units/1 USD
function ratesAsCSV() {
    return `Andorran Franc,ADF,0.1696,5.8972
Andorran Peseta,ADP,0.006686,149.585
Utd. Arab Emir. Dirham,AED,0.2723,3.674
Afghanistan Afghani,AFN,0.01454,68.96
Albanian Lek,ALL,0.008192,126.563
Armenian Dram,AMD,0.002094,477.71
NL Antillian Guilder,ANG,0.5618,1.82
Angolan Kwanza,AOA,0.006058,166.709
Angolan New Kwanza,AON,0.006058,166.709
Argentine Peso,ARS,0.07186,13.9245
Austrian Schilling,ATS,0.08085,12.3708
Australian Dollar,AUD,0.7178,1.3935
Aruban Florin,AWG,0.5587,1.81
Azerbaijan Manat,AZM,0.0001342,7453
Azerbaijan New Manat,AZN,0.6709,1.4906
Bosnian Mark,BAM,0.5688,1.7584
Barbados Dollar,BBD,0.5,2
Bangladeshi Taka,BDT,0.01294,80.5299
Belgian Franc,BEF,0.02758,36.2665
Bulgarian Lev,BGN,0.5716,1.766
Bahraini Dinar,BHD,2.6707,0.3798
Burundi Franc,BIF,0.0006485,1592.45
Bermudian Dollar,BMD,1,1
Brunei Dollar,BND,0.7353,1.4049
Bolivian Boliviano,BOB,0.1485,7.0924
Brazilian Real,BRL,0.2778,3.6071
Bahamian Dollar,BSD,1.0096,1.003
Bhutan Ngultrum,BTN,0.01489,67.2107
Botswana Pula,BWP,0.09021,11.3736
Belarusian Ruble,BYR,5.06e-05,19853.7
Belize Dollar,BZD,0.5072,2.0616
Canadian Dollar,CAD,0.7657,1.3063
Congolese Franc,CDF,0.001094,944
Swiss Franc,CHF,1.0065,0.9938
Chilean Peso,CLP,0.001476,702.54
Chinese Yuan Renminbi,CNY,0.1519,6.5845
Colombian Peso,COP,0.0003308,3112.5
Costa Rican Colon,CRC,0.001904,550.254
Cuban Convertible Peso,CUC,1,1
Cuban Peso,CUP,0.045,23.1481
Cape Verde Escudo,CVE,0.01009,99.1304
Cyprus Pound,CYP,1.9008,0.5262
Czech Koruna,CZK,0.04118,24.2974
German Mark,DEM,0.5688,1.7583
Djibouti Franc,DJF,0.005627,177.72
Danish Krone,DKK,0.1496,6.6865
Dominican R. Peso,DOP,0.02204,46.8022
Algerian Dinar,DZD,0.009091,110.984
Ecuador Sucre,ECS,4.15e-05,25587
Estonian Kroon,EEK,0.0711,14.0666
Egyptian Pound,EGP,0.1129,8.9028
Spanish Peseta,ESP,0.006686,149.585
Ethiopian Birr,ETB,0.04641,21.996
Euro,EUR,1.1125,0.899
Finnish Markka,FIM,0.1871,5.3453
Fiji Dollar,FJD,0.4751,2.1274
Falkland Islands Pound,FKP,1.4621,0.6842
French Franc,FRF,0.1696,5.8972
British Pound,GBP,1.462,0.6841
Georgian Lari,GEL,0.4657,2.1472
Ghanaian Cedi,GHC,2.586e-05,39119.9
Ghanaian New Cedi,GHS,0.2586,3.912
Gibraltar Pound,GIP,1.4621,0.6842
Gambian Dalasi,GMD,0.02378,43.65
Guinea Franc,GNF,0.0001367,7475.74
Greek Drachma,GRD,0.003265,306.342
Guatemalan Quetzal,GTQ,0.1338,7.8348
Guyanese Dollar,GYD,0.005019,217.235
Hong Kong Dollar,HKD,0.1287,7.7686
Honduran Lempira,HNL,0.04492,23.1625
Croatian Kuna,HRK,0.1493,6.7651
Haitian Gourde,HTG,0.01611,63.8519
Hungarian Forint,HUF,0.003544,282.447
Indonesian Rupiah,IDR,7.34e-05,13661.2
Irish Punt,IEP,1.4126,0.708
Israeli New Shekel,ILS,0.2601,3.8541
Indian Rupee,INR,0.0149,67.2819
Iraqi Dinar,IQD,0.0008715,1201.37
Iranian Rial,IRR,3.319e-05,30183
Iceland Krona,ISK,0.008008,125.47
Italian Lira,ITL,0.0005745,1740.75
Jamaican Dollar,JMD,0.008091,126.828
Jordanian Dinar,JOD,1.4168,0.7108
Japanese Yen,JPY,0.009007,111.047
Kenyan Shilling,KES,0.01005,102.078
Kyrgyzstanian Som,KGS,0.01464,68.2986
Cambodian Riel,KHR,0.0002495,4188.31
Comoros Franc,KMF,0.002345,427.3
North Korean Won,KPW,0.007407,135
South-Korean Won,KRW,0.0008411,1191.61
Kuwaiti Dinar,KWD,3.3125,0.3029
Cayman Islands Dollar,KYD,1.2223,0.8541
Kazakhstan Tenge,KZT,0.002987,340.23
Lao Kip,LAK,0.0001262,8371.59
Lebanese Pound,LBP,0.0006772,1548.56
Sri Lanka Rupee,LKR,0.006904,151.128
Liberian Dollar,LRD,0.01111,91
Lesotho Loti,LSL,0.063403,15.79382
Lithuanian Litas,LTL,0.3222,3.1041
Luxembourg Franc,LUF,0.02758,36.2665
Latvian Lats,LVL,1.5829,0.6318
Libyan Dinar,LYD,0.7399,1.4055
Moroccan Dirham,MAD,0.1035,9.8683
Moldovan Leu,MDL,0.05054,20.3257
Malagasy Ariary,MGA,0.0003124,3291.45
Malagasy Franc,MGF,0.0001093,9150.46
Macedonian Denar,MKD,0.0182,55.7395
Myanmar Kyat,MMK,0.0008557,1208.12
Mongolian Tugrik,MNT,0.000502,1997
Macau Pataca,MOP,0.1274,8.2059
Mauritanian Ouguiya,MRO,0.002849,363.581
Maltese Lira,MTL,2.5914,0.386
Mauritius Rupee,MUR,0.02942,36.6068
Maldive Rufiyaa,MVR,0.06689,15.15
Malawi Kwacha,MWK,0.001597,646
Mexican Peso,MXN,0.05412,18.4874
Malaysian Ringgit,MYR,0.2433,4.1162
Mozambique Metical,MZM,1.768e-05,56760
Mozambique New Metical,MZN,0.01768,56.76
Namibia Dollar,NAD,0.063403,15.79382
Nigerian Naira,NGN,0.005076,202.392
Nicaraguan Cordoba Oro,NIO,0.03549,29.0739
Dutch Guilder,NLG,0.5048,1.9812
Norwegian Kroner,NOK,0.1198,8.3527
Nepalese Rupee,NPR,0.009415,109.267
New Zealand Dollar,NZD,0.6695,1.4942
Omani Rial,OMR,2.6057,0.3864
Panamanian Balboa,PAB,1,1
Peruvian Nuevo Sol,PEN,0.3043,3.4304
Papua New Guinea Kina,PGK,0.3315,3.1603
Philippine Peso,PHP,0.02142,46.8523
Pakistan Rupee,PKR,0.009641,106.594
Polish Zloty,PLN,0.2533,3.9506
Portuguese Escudo,PTE,0.005549,180.238
Paraguay Guarani,PYG,0.00018,5789.57
Qatari Rial,QAR,0.2749,3.6452
Romanian Lei,ROL,2.473e-05,40550.5
Romanian New Lei,RON,0.2473,4.055
Serbian Dinar,RSD,0.009061,111.067
Russian Rouble,RUB,0.01518,65.9234
Rwandan Franc,RWF,0.00136,762.434
Saudi Riyal,SAR,0.2668,3.7526
Solomon Islands Dollar,SBD,0.125,8.058
Seychelles Rupee,SCR,0.08152,13.9698
Sudanese Dinar,SDD,0.001652,614.488
Sudanese Pound,SDG,0.1652,6.1449
Sudanese Old Pound,SDP,0.0004423,2272.3
Swedish Krona,SEK,0.1199,8.3448
Singapore Dollar,SGD,0.724,1.3817
St. Helena Pound,SHP,1.5694,0.6373
Slovenian Tolar,SIT,0.004642,215.442
Slovak Koruna,SKK,0.03693,27.0839
Sierra Leone Leone,SLL,0.0002561,4005
Somali Shilling,SOS,0.001797,628.382
Suriname Dollar,SRD,0.1563,6.45
Suriname Guilder,SRG,0.0001563,6450
Sao Tome/Principe Dobra,STD,4.54e-05,22025.9
El Salvador Colon,SVC,0.1168,8.9954
Syrian Pound,SYP,0.004589,218.2
Swaziland Lilangeni,SZL,0.063403,15.79382
Thai Baht,THB,0.02801,35.7978
Tajikistani Somoni,TJS,0.1271,7.8695
Turkmenistan Manat,TMM,5.7e-05,17587.5
Turkmenistan New Manat,TMT,0.2864,3.5175
Tunisian Dinar,TND,0.477,2.1066
Tonga Pa'anga,TOP,0.4341,2.3088
Turkish Old Lira,TRL,3.381e-07,2960050
Turkish Lira,TRY,0.3381,2.96
Trinidad/Tobago Dollar,TTD,0.1525,6.8264
Taiwan Dollar,TWD,0.03066,32.6566
Tanzanian Shilling,TZS,0.0004644,2243.16
Ukraine Hryvnia,UAH,0.04004,25.5139
Uganda Shilling,UGX,0.0002999,3415.53
US Dollar,USD,1,1
Uruguayan Peso,UYU,0.03249,31.8608
Uzbekistan Som,UZS,0.0003438,2979
Venezuelan Bolivar,VEB,0.0001002,10000
Venezuelan Bolivar Fuerte,VEF,0.1002,10
Vietnamese Dong,VND,4.516e-05,22781.1
Vanuatu Vatu,VUV,0.009112,111.75
Samoan Tala,WST,0.4407,2.3602
CFA Franc BEAC,XAF,0.001696,589.729
Silver (oz.),XAG,16.027,0.06249
Gold (oz.),XAU,1206.22,0.0008293
East Caribbean Dollar,XCD,0.372,2.7169
ECU,XEU,1.1125,0.899
CFA Franc BCEAO,XOF,0.001696,589.715
Palladium (oz.),XPD,544.912,0.001845
CFP Franc,XPF,0.009326,107.224
Platinum (oz.),XPT,977.5,0.001034
Yemeni Rial,YER,0.004022,248.75
Yugoslav Dinar,YUN,0.009061,111.067
South African Rand,ZAR,0.0634,15.7938
Zambian Kwacha,ZMK,0.0001932,5328.9
Zambian  Kwacha,ZMW,0.09643,10.46
Zimbabwe Dollar,ZWD,0.002679,376.3`
}
