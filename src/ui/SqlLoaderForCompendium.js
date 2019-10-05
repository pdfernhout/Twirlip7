import { SqlUtils } from "./SqlUtils.js"

// TODO: Generify to load any Compendium SQL dump file

let compendiumFeatureSuggestionsTables = null
let loadingPromise = null

async function _loadCompendiumFeatureSuggestions() {
    const response = await fetch("examples/feature_suggestions_compendium_map.sql")
    const fileContents = await response.text()
    compendiumFeatureSuggestionsTables = SqlUtils.parseSqlIntoTables(fileContents)
    m.redraw()
    return fileContents
}

function loadCompendiumFeatureSuggestions() {
    if (!loadingPromise) loadingPromise = _loadCompendiumFeatureSuggestions()
    return loadingPromise
}

function importNodeTable(p, nodeTable) {
    // console.log("nodeTable", nodeTable)
    for (let node of nodeTable) {
        const id = {collageUUID: node.NodeID}
        for (let fieldName of [
            "Author",
            "CreationDate",
            "CurrentStatus",
            "Detail",
            "ExtendedNodeType",
            "Label",
            "LastModAuthor",
            "ModificationDate",
            "NodeID",
            "NodeType",
            "OriginalID"
        ]) {
            let value = node[fieldName]
            if (fieldName.endsWith("Date")) value = new Date(value).toISOString()
            if (fieldName === "Detail") value = value.replace(/\\n/g, "\n")
            const fieldNameAdjusted = fieldName.charAt(0).toLowerCase() + fieldName.substring(1)
            p.addTriple(id, fieldNameAdjusted, value)
        }
        const typeName = {
            0: "General",

            1: "List",
            2: "Map",
            3: "Issue",
            4: "Position",
            5: "Argument",
            6: "Pro",
            7: "Con",
            8: "Decision",
            9: "Reference",
            10: "Note",

            11: "ListShortcut",
            12: "MapShortcut",
            13: "IssueShortcut",
            14: "PositionShortcut",
            15: "ArgumentShortcut",
            16: "ProShortcut",
            17: "ConShortcut",
            18: "DecisionShortcut",
            19: "ReferenceShortcut",
            20: "NoteShortcut",

            21: "PlannerMap",
            22: "MovieMap",
            31: "PlannerMapShortcut",
            32: "MovieMapShortcut",

            // trashbin and inbox are system nodes with only one instance
            51: "Trashbin",
            52: "Inbox",
        }[node.NodeType]
        p.addTriple(id, "type", typeName)
    }
}

function importViewNodeTable(p, viewNodeTable) {
    // console.log("viewNodeTable", viewNodeTable)
    for (let row of viewNodeTable) {
        const id = {collageUUID: row.ViewID}
        const modifiedRow = {}
        for (let fieldName of [
            "Background",
            "CreationDate",
            "CurrentStatus",
            "FontFace",
            "FontSize",
            "FontStyle",
            "Foreground",
            "HideIcon",
            "LabelWrapWidth",
            "ModificationDate",
            "NodeID",
            "ShowTags",
            "ShowText",
            "ShowTrans",
            "ShowWeight",
            "SmallIcon",
            "ViewID",
            "XPos",
            "YPos"
        ]) {
            let value = row[fieldName]
            if (fieldName.endsWith("Date")) {
                value = new Date(value).toISOString()
                row[fieldName] = value
            }
            const fieldNameAdjusted = fieldName.charAt(0).toLowerCase() + fieldName.substring(1)
            modifiedRow[fieldNameAdjusted] = value
        }
        modifiedRow.id = modifiedRow.nodeID
        // console.log("adding for ", modifiedRow.id, {contains: modifiedRow.id})
        p.addTriple(id, {contains: modifiedRow.id}, modifiedRow)
    }
}

const linkTypeNumberToName = {
    39: "RespondsTo",
    40: "Supports",
    41: "ObjectsTo",
    42: "Challenges",
    43: "Specializes",
    44: "ExpandsOn",
    45: "RelatedTo",
    46: "About"
}

function importLinkTable(p, linkTable) {
    // console.log("linkTable", linkTable)
    for (let link of linkTable) {
        const id = {collageUUID: link.LinkID}
        for (let fieldName of [
            "Author",
            "CreationDate",
            "CurrentStatus",
            "FromNode",
            "Label",
            "LinkID",
            "LinkType",
            "ModificationDate",
            "OriginalID",
            "ToNode"
        ]) {
            let value = link[fieldName]
            if (fieldName.endsWith("Date")) {
                value = new Date(value).toISOString()
            }
            if (fieldName === "LinkType") value = linkTypeNumberToName[value] || "RespondsTo"
            const fieldNameAdjusted = fieldName.charAt(0).toLowerCase() + fieldName.substring(1)
            p.addTriple(id, fieldNameAdjusted, value)
        }
        p.addTriple(id, "type", "Link")
    }
}
     
function importViewLinkTable(p, viewLinkTable) {
    // console.log("viewLinkTable", viewLinkTable)
    for (let row of viewLinkTable) {
        const id = {collageUUID: row.ViewID}
        const modifiedRow = {}
        for (let fieldName of [
            "ArrowType",
            "Background",
            "CreationDate",
            "CurrentStatus",
            "FontFace",
            "FontSize",
            "FontStyle",
            "Foreground",
            "LabelWrapWidth",
            "LinkColour",
            "LinkDashed",
            "LinkID",
            "LinkStyle",
            "LinkWeight",
            "ModificationDate",
            "ViewID"
        ]) {
            let value = row[fieldName]
            if (fieldName.endsWith("Date")) {
                value = new Date(value).toISOString()
                row[fieldName] = value
            }
            const fieldNameAdjusted = fieldName.charAt(0).toLowerCase() + fieldName.substring(1)
            modifiedRow[fieldNameAdjusted] = value
        }
        modifiedRow.id = modifiedRow.linkID
        // TODO: Maybe "hasLink" should be "contains" with some way to distinguish links from other items?
        p.addTriple(id, {hasLink: modifiedRow.id}, modifiedRow)
    }
}

// parameter p is expected to be a Pointrel triple store
async function importFeatureSuggestions(p) {
    if (!confirm("Import feature suggestions?\n(This adds a lot of data.)")) return
    await loadCompendiumFeatureSuggestions()
    // console.log("compendiumFeatureSuggestionsTables", compendiumFeatureSuggestionsTables)
    const nodeTable = compendiumFeatureSuggestionsTables["Node"]
    importNodeTable(p, nodeTable)
    const viewNodeTable = compendiumFeatureSuggestionsTables["ViewNode"]
    importViewNodeTable(p, viewNodeTable)
    const linkTable = compendiumFeatureSuggestionsTables["Link"]
    importLinkTable(p, linkTable)
    const viewLinkTable = compendiumFeatureSuggestionsTables["ViewLink"]
    importViewLinkTable(p, viewLinkTable)
}

export const SqlLoaderForCompendium = {
    getCompendiumFeatureSuggestionsTables: () => compendiumFeatureSuggestionsTables,
    loadCompendiumFeatureSuggestions,
    importFeatureSuggestions
}