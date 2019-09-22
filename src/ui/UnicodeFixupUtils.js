// This utility is for fixing up unicode text that was incorrectly mapped from a windows1252 character set.
// The incorrect remapping results in two or three byte single unicode characters
// becoming multiple characters in the text. This utility fixes that situation.

function defineRemapTableForWindows1252() {

    const remapTable = []
    
    function remap(unicode, windows1252, expected, actual, utf8Bytes) {
        remapTable.push({unicode, windows1252, expected, actual, utf8Bytes})
    }

    // Data from: https://www.i18nqa.com/debug/utf8-debug.html

    remap("U+20AC", "0x80", "€", "â‚¬", "%E2 %82 %AC")
    remap("U+00C0", "0xC0", "À", "Ã€", "%C3 %80")

    remap("", "0x81", "", "", "")
    remap("U+00C1", "0xC1", "Á", "Ã", "%C3 %81")

    remap("U+201A", "0x82", "‚", "â€š", "%E2 %80 %9A")
    remap("U+00C2", "0xC2", "Â", "Ã‚", "%C3 %82")

    remap("U+0192", "0x83", "ƒ", "Æ’", "%C6 %92")
    remap("U+00C3", "0xC3", "Ã", "Ãƒ", "%C3 %83")

    remap("U+201E", "0x84", "„", "â€ž", "%E2 %80 %9E")
    remap("U+00C4", "0xC4", "Ä", "Ã„", "%C3 %84")

    remap("U+2026", "0x85", "…", "â€¦", "%E2 %80 %A6")
    remap("U+00C5", "0xC5", "Å", "Ã…", "%C3 %85")

    remap("U+2020", "0x86", "†", "â€ ", "%E2 %80 %A0")
    remap("U+00C6", "0xC6", "Æ", "Ã†", "%C3 %86")

    remap("U+2021", "0x87", "‡", "â€¡", "%E2 %80 %A1")
    remap("U+00C7", "0xC7", "Ç", "Ã‡", "%C3 %87")

    remap("U+02C6", "0x88", "ˆ", "Ë†", "%CB %86")
    remap("U+00C8", "0xC8", "È", "Ãˆ", "%C3 %88")

    remap("U+2030", "0x89", "‰", "â€°", "%E2 %80 %B0")
    remap("U+00C9", "0xC9", "É", "Ã‰", "%C3 %89")

    remap("U+0160", "0x8A", "Š", "Å ", "%C5 %A0")
    remap("U+00CA", "0xCA", "Ê", "ÃŠ", "%C3 %8A")

    remap("U+2039", "0x8B", "‹", "â€¹", "%E2 %80 %B9")
    remap("U+00CB", "0xCB", "Ë", "Ã‹", "%C3 %8B")

    remap("U+0152", "0x8C", "Œ", "Å’", "%C5 %92")
    remap("U+00CC", "0xCC", "Ì", "ÃŒ", "%C3 %8C")

    remap("", "0x8D", "", "", "")
    remap("U+00CD", "0xCD", "Í", "Ã", "%C3 %8D")

    remap("U+017D", "0x8E", "Ž", "Å½", "%C5 %BD")
    remap("U+00CE", "0xCE", "Î", "ÃŽ", "%C3 %8E")

    remap("", "0x8F", "", "", "")
    remap("U+00CF", "0xCF", "Ï", "Ã", "%C3 %8F")

    remap("", "0x90", "", "", "")
    remap("U+00D0", "0xD0", "Ð", "Ã", "%C3 %90")

    remap("U+2018", "0x91", "‘", "â€˜", "%E2 %80 %98")
    remap("U+00D1", "0xD1", "Ñ", "Ã‘", "%C3 %91")

    remap("U+2019", "0x92", "’", "â€™", "%E2 %80 %99")
    remap("U+00D2", "0xD2", "Ò", "Ã’", "%C3 %92")

    remap("U+201C", "0x93", "“", "â€œ", "%E2 %80 %9C")
    remap("U+00D3", "0xD3", "Ó", "Ã“", "%C3 %93")

    remap("U+201D", "0x94", "”", "â€", "%E2 %80 %9D")
    remap("U+00D4", "0xD4", "Ô", "Ã”", "%C3 %94")

    remap("U+2022", "0x95", "•", "â€¢", "%E2 %80 %A2")
    remap("U+00D5", "0xD5", "Õ", "Ã•", "%C3 %95")

    remap("U+2013", "0x96", "–", "â€“", "%E2 %80 %93")
    remap("U+00D6", "0xD6", "Ö", "Ã–", "%C3 %96")

    remap("U+2014", "0x97", "—", "â€”", "%E2 %80 %94")
    remap("U+00D7", "0xD7", "×", "Ã—", "%C3 %97")

    remap("U+02DC", "0x98", "˜", "Ëœ", "%CB %9C")
    remap("U+00D8", "0xD8", "Ø", "Ã˜", "%C3 %98")

    remap("U+2122", "0x99", "™", "â„¢", "%E2 %84 %A2")
    remap("U+00D9", "0xD9", "Ù", "Ã™", "%C3 %99")

    remap("U+0161", "0x9A", "š", "Å¡", "%C5 %A1")
    remap("U+00DA", "0xDA", "Ú", "Ãš", "%C3 %9A")

    remap("U+203A", "0x9B", "›", "â€º", "%E2 %80 %BA")
    remap("U+00DB", "0xDB", "Û", "Ã›", "%C3 %9B")

    remap("U+0153", "0x9C", "œ", "Å“", "%C5 %93")
    remap("U+00DC", "0xDC", "Ü", "Ãœ", "%C3 %9C")

    remap("", "0x9D", "", "", "")
    remap("U+00DD", "0xDD", "Ý", "Ã", "%C3 %9D")

    remap("U+017E", "0x9E", "ž", "Å¾", "%C5 %BE")
    remap("U+00DE", "0xDE", "Þ", "Ãž", "%C3 %9E")

    remap("U+0178", "0x9F", "Ÿ", "Å¸", "%C5 %B8")
    remap("U+00DF", "0xDF", "ß", "ÃŸ", "%C3 %9F")

    remap("U+00A0", "0xA0", "", "Â ", "%C2 %A0")
    remap("U+00E0", "0xE0", "à", "Ã ", "%C3 %A0")

    remap("U+00A1", "0xA1", "¡", "Â¡", "%C2 %A1")
    remap("U+00E1", "0xE1", "á", "Ã¡", "%C3 %A1")

    remap("U+00A2", "0xA2", "¢", "Â¢", "%C2 %A2")
    remap("U+00E2", "0xE2", "â", "Ã¢", "%C3 %A2")

    remap("U+00A3", "0xA3", "£", "Â£", "%C2 %A3")
    remap("U+00E3", "0xE3", "ã", "Ã£", "%C3 %A3")

    remap("U+00A4", "0xA4", "¤", "Â¤", "%C2 %A4")
    remap("U+00E4", "0xE4", "ä", "Ã¤", "%C3 %A4")

    remap("U+00A5", "0xA5", "¥", "Â¥", "%C2 %A5")
    remap("U+00E5", "0xE5", "å", "Ã¥", "%C3 %A5")

    remap("U+00A6", "0xA6", "¦", "Â¦", "%C2 %A6")
    remap("U+00E6", "0xE6", "æ", "Ã¦", "%C3 %A6")

    remap("U+00A7", "0xA7", "§", "Â§", "%C2 %A7")
    remap("U+00E7", "0xE7", "ç", "Ã§", "%C3 %A7")

    remap("U+00A8", "0xA8", "¨", "Â¨", "%C2 %A8")
    remap("U+00E8", "0xE8", "è", "Ã¨", "%C3 %A8")

    remap("U+00A9", "0xA9", "©", "Â©", "%C2 %A9")
    remap("U+00E9", "0xE9", "é", "Ã©", "%C3 %A9")

    remap("U+00AA", "0xAA", "ª", "Âª", "%C2 %AA")
    remap("U+00EA", "0xEA", "ê", "Ãª", "%C3 %AA")

    remap("U+00AB", "0xAB", "«", "Â«", "%C2 %AB")
    remap("U+00EB", "0xEB", "ë", "Ã«", "%C3 %AB")

    remap("U+00AC", "0xAC", "¬", "Â¬", "%C2 %AC")
    remap("U+00EC", "0xEC", "ì", "Ã¬", "%C3 %AC")

    remap("U+00AD", "0xAD", "­", "Â­", "%C2 %AD")
    remap("U+00ED", "0xED", "í", "Ã­", "%C3 %AD")

    remap("U+00AE", "0xAE", "®", "Â®", "%C2 %AE")
    remap("U+00EE", "0xEE", "î", "Ã®", "%C3 %AE")

    remap("U+00AF", "0xAF", "¯", "Â¯", "%C2 %AF")
    remap("U+00EF", "0xEF", "ï", "Ã¯", "%C3 %AF")

    remap("U+00B0", "0xB0", "°", "Â°", "%C2 %B0")
    remap("U+00F0", "0xF0", "ð", "Ã°", "%C3 %B0")

    remap("U+00B1", "0xB1", "±", "Â±", "%C2 %B1")
    remap("U+00F1", "0xF1", "ñ", "Ã±", "%C3 %B1")

    remap("U+00B2", "0xB2", "²", "Â²", "%C2 %B2")
    remap("U+00F2", "0xF2", "ò", "Ã²", "%C3 %B2")

    remap("U+00B3", "0xB3", "³", "Â³", "%C2 %B3")
    remap("U+00F3", "0xF3", "ó", "Ã³", "%C3 %B3")

    remap("U+00B4", "0xB4", "´", "Â´", "%C2 %B4")
    remap("U+00F4", "0xF4", "ô", "Ã´", "%C3 %B4")

    remap("U+00B5", "0xB5", "µ", "Âµ", "%C2 %B5")
    remap("U+00F5", "0xF5", "õ", "Ãµ", "%C3 %B5")

    remap("U+00B6", "0xB6", "¶", "Â¶", "%C2 %B6")
    remap("U+00F6", "0xF6", "ö", "Ã¶", "%C3 %B6")

    remap("U+00B7", "0xB7", "·", "Â·", "%C2 %B7")
    remap("U+00F7", "0xF7", "÷", "Ã·", "%C3 %B7")

    remap("U+00B8", "0xB8", "¸", "Â¸", "%C2 %B8")
    remap("U+00F8", "0xF8", "ø", "Ã¸", "%C3 %B8")

    remap("U+00B9", "0xB9", "¹", "Â¹", "%C2 %B9")
    remap("U+00F9", "0xF9", "ù", "Ã¹", "%C3 %B9")

    remap("U+00BA", "0xBA", "º", "Âº", "%C2 %BA")
    remap("U+00FA", "0xFA", "ú", "Ãº", "%C3 %BA")

    remap("U+00BB", "0xBB", "»", "Â»", "%C2 %BB")
    remap("U+00FB", "0xFB", "û", "Ã»", "%C3 %BB")

    remap("U+00BC", "0xBC", "¼", "Â¼", "%C2 %BC")
    remap("U+00FC", "0xFC", "ü", "Ã¼", "%C3 %BC")

    remap("U+00BD", "0xBD", "½", "Â½", "%C2 %BD")
    remap("U+00FD", "0xFD", "ý", "Ã½", "%C3 %BD")

    remap("U+00BE", "0xBE", "¾", "Â¾", "%C2 %BE")
    remap("U+00FE", "0xFE", "þ", "Ã¾", "%C3 %BE")

    remap("U+00BF", "0xBF", "¿", "Â¿", "%C2 %BF")
    remap("U+00FF", "0xFF", "ÿ", "Ã¿", "%C3 %BF")

    return remapTable
}

function remapWindows1252(unicodeText) {
    let result = unicodeText

    const remapTable = defineRemapTableForWindows1252()

    // Check longer remaps first as otherwise shorter ones may mess up longer sequences
    remapTable.sort((a, b) => b.actual.length - a.actual.length)
    console.log("remapTable", remapTable)

    for (let remap of remapTable) {
        const regex = new RegExp(remap.actual, "g")
        if (remap.actual) {
            if (result.match(regex)) console.log("match for ", remap.actual, remap.expected)
            result = result.replace(regex, remap.expected)
        }
    }
    console.log("result", result)
    return result
}

export const UnicodeFixupUtils = {
    remapWindows1252
}
