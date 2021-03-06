"use strict"
/* eslint-disable no-console */

// defines m
import "./vendor/mithril.js"

import NameTracker from "./NameTracker.js"
import { FileUtils } from "./FileUtils.js"
import { Progress } from "./Progress.js"
import { Toast } from "./Toast.js"

import { Pointrel20190914 } from "./Pointrel20190914.js"
import { CanonicalJSON } from "./CanonicalJSON.js"

const p = new Pointrel20190914()

const nameTracker = new NameTracker({
    hashNameField: "name",
    displayNameLabel: "Name",
    defaultName: "organizer-test",
    nameChangedCallback: startup
})

function getOrganizerName() {
    if (!nameTracker.name || nameTracker.name === "organizer") return "organizer"
    return "organizer:" + nameTracker.name
}

const sortOptions = ["order", "date", "subject", "from"]
let sortBy = "order"

class Item {
    constructor(uuid) {
        this.uuid = uuid || p.uuidv4()
    }

    getType() {
        return p.findC(this.uuid, "type")
    }

    setType(type) {
        p.addTriple(this.uuid, "type", type)
    }

    getTitle() {
        return p.findC(this.uuid, "title") || ""
    }

    setTitle(title) {
        p.addTriple(this.uuid, "title", title)
    }

    getFrom() {
        return p.findC(this.uuid, "from") || ""
    }

    setFrom(title) {
        p.addTriple(this.uuid, "from", title)
    }

    getDate() {
        let result = p.findC(this.uuid, "date") || ""
        if (result) {
            try {
                result = new Date(Date.parse(result)).toISOString().replace("T", " ")
            } catch (e) {
                // Do nothing
            }
        }
        return result
    }

    setDate(title) {
        p.addTriple(this.uuid, "date", title)
    }

    getBody() {
        // Keep body in a separate stream in case it is big
        const body = p.findC({emailBodyFor: this.uuid}, "body") || ""
        return body
    }

    setBody(body) {
        // Keep body in a separate stream in case it is big
        p.addTriple({emailBodyFor: this.uuid}, "body", body)
    }
}

class Organizer {
    getItems() {
        const result = []
        const bcMap = p.findBC(getOrganizerName(), "item")
        for (let key in bcMap) {
            const uuid = bcMap[key]
            if (uuid) result.push(new Item(uuid))
        }
        return result
    }

    async addItem(item, summary) {
        // Keep a copy of essential information
        if (summary) p.addTriple(getOrganizerName(), {itemSummary: item.uuid}, summary)
        await p.addTripleAsync(getOrganizerName(), {item: item.uuid}, item.uuid)
    }

    deleteItem(item) {
        p.addTriple(getOrganizerName(), {item: item.uuid}, null)
    }

    getSummaryForItem(uuid) {
        return p.findC(getOrganizerName(), {itemSummary: uuid})
    }
}

let organizer = new Organizer()

function makeNewItem() {
    const item = new Item()
    organizer.addItem(item)
}

async function saveEmail(email) {
    // console.log("saveEmail", email)
    const subject = email.match(/^Subject: ([^\n]*)/m)
    const messageIdMatcher = email.match(/^Message-ID: <([^>]*)/mi)
    let messageId 
    if (messageIdMatcher) messageId = messageIdMatcher[1]
    if (!messageId) {
        console.log("missing message ID", email)
        messageId = p.uuidv4()
    }

    const title = subject ? subject[1] : ""

    const fromMatch = email.match(/^From: ([^\n]*)/m)
    const from = fromMatch ? fromMatch[1] : ""
    const dateMatch = email.match(/^Date: ([^\n]*)/m)
    const date = dateMatch ? dateMatch[1] : ""

    const uuid = {type: "email-test05", messageId}

    // console.log("subject", title)
    // console.log("messageId", messageId)
    // console.log("==== Importing #", emailCount)

    const item = new Item(uuid)
    item.setType("email:mbox")
    item.setTitle(title)
    item.setFrom(from)
    item.setDate(date)
    item.setBody(email)

    await organizer.addItem(item, {title, from, date})
}

let emailsToImport = []

function importMailbox() {
    FileUtils.loadFromFile((name, contents) => {
        console.log("importMailbox", name)
        const emails = contents.split(/^From /m)
        const totalEmailCount = emails.length
        let emailCount = 0
        emailsToImport = emails

        // Hide the list while importing to prevent lots of long UI updates for each echoed triple message
        loading = true
        // Do loop as a timeout series so UI will update
        setTimeout(async function processEmail() {
            if (!emailsToImport.length) {
                loading = false
                Progress.progress("")
                Toast.toast("Imported " + emailCount + " email(s)")
                m.redraw()
                return
            }
            let email = emailsToImport.shift()
            emailCount++
            if (email && email !== " ") {
                // email = email.replace(/^>From /m, "From ")
                email = "From " + email
                if (emailCount % 100 === 1) {
                    Progress.progress("Importing email #" + emailCount + " of " + totalEmailCount)
                    m.redraw()
                }
                // Wait for each email to be saved before sending the next
                // This is to avoid overwelming the server
                // Also, otherwise the user may close the window before everything is saved
                await saveEmail(email)
            }
            setTimeout(processEmail, 0)
        }, 0)
    })
}

let currentUUID = null
let editMode = false

function displayItemEditor(item) {
    return m("div.ba.bw1.pa1", [
        m("span", "UUID: ", " ", JSON.stringify(item.uuid)),
        m("br"),
        m("span", "Title:"),
        m("input.ml1.w-90", { value: item.getTitle(), onchange: (event) => item.setTitle(event.target.value) }),
        m("br"),
        "Text:",
        m("br"),
        m("textarea", { rows: 5, cols: 60,  value: item.getBody(), onchange: (event) => item.setBody(event.target.value) }),
    ])
}

const showHeaders = {}

function rtrim(string) {
    // Trim trailing space from string
    return string.replace(/\s*$/,"")
}

function displayItemContents(item) {
    const body = item.getBody()
    let headers = ""
    let rest = body
    if (body.startsWith("From ")) {
        headers = body.split(/\n\s*\n/)[0]
        if (headers.length === body.length) {
            headers = ""
        } else {
            headers = rtrim(headers)
        }
        rest = body.substring(headers.length)
    }
    rest = rest.trim() || ""
    return m("div.ba.bw1.pa1", [
        headers ? [
            m("button.f6.mr1", { onclick: () => showHeaders[item.uuid] = !showHeaders[item.uuid] }, "Headers"),
        ] : [],
        m("span", "UUID: ", " ", JSON.stringify(item.uuid)),
        showHeaders[item.uuid] ? m("pre", {style: "white-space: pre-wrap"}, headers) : [],
        m("pre", {style: "white-space: pre-wrap"}, rest),
    ])

}

// TODO: optimize exessive stringify use
function isUUIDMatch(a, b) {
    return CanonicalJSON.stringify(a) === CanonicalJSON.stringify(b)
}

function displayItem(item, index) {
    const summary = organizer.getSummaryForItem(item.uuid)
    const from = summary ? summary.from : item.getFrom()
    const fromEmail = "<" + (from.split(" (")[0] || "").replace(/"/g, "") + ">"
    const fromName = "(" + from.split(" (")[1] || ""
    const date = summary ? summary.date : item.getDate()
    const title = summary ? summary.title : item.getTitle()
    return m("div.mt1", {key: JSON.stringify(item.uuid)}, [
        m("button.f6", {onclick: () => {
            currentUUID = (isUUIDMatch(currentUUID, item.uuid) && !editMode) ? null : item.uuid
            editMode = false
        }}, "Show"),
        m("button.ml1.mr1.f6", {onclick: () => {
            currentUUID = (isUUIDMatch(currentUUID, item.uuid) && editMode) ? null : item.uuid
            editMode = true
        }}, "Edit"),
        m("span.dib.w2.tr", index), " ", 
        m("span.ml2", { title: date }, title),
        m("span.ml2.f6", { title: fromEmail }, fromName),
        m("br"),
        
        (isUUIDMatch(item.uuid, currentUUID) && editMode) ? displayItemEditor(item) : [],
        (isUUIDMatch(item.uuid, currentUUID) && !editMode) ? displayItemContents(item) : []
    ])
}

function compareItems(a, b) {
    const aSummary = organizer.getSummaryForItem(a.uuid)
    const bSummary = organizer.getSummaryForItem(b.uuid)
    const aDate = aSummary ? aSummary.date : a.getDate()
    const bDate = bSummary ? bSummary.date : b.getDate()

    if (sortBy === "date") return aDate.localeCompare(bDate)

    if (sortBy === "subject") {
        const aTitle = aSummary ? aSummary.title : a.getTitle()
        const bTitle = bSummary ? bSummary.title : b.getTitle()
        let result = aTitle.localeCompare(bTitle)
        if (result === 0) result = aDate.localeCompare(bDate)
        return result
    }

    if (sortBy === "from") {
        const aFrom = aSummary ? aSummary.from : a.getFrom()
        const bFrom = bSummary ? bSummary.from : b.getFrom()
        let result = aFrom.localeCompare(bFrom)
        if (result === 0) result = aDate.localeCompare(bDate)
        return result
    }

    throw new Error("unexpected sort")
}

function sortItems(items) {
    if (sortBy === "order") return
    return items.sort(compareItems)
}

let loading = true
let redraws = 0

let totalRedrawCount = 0

function displayItems() {
    const items = organizer.getItems()
    sortItems(items)
    return m("div.ma1", [
        m("span", "Total redraw count: " + ++totalRedrawCount),
        Progress.viewProgress(),
        Toast.viewToast(),
        m("div",
            "Sort by:",
            m("select.ma1", {onchange: event => sortBy = event.target.value},
                sortOptions.map(key => {
                    return m("option", {value: key, selected: sortBy === key}, key)
                })
            ),
        ),
        loading
            ? m("span", "Loading...", redraws++)
            : items.map((item, index) => {
                return displayItem(item, index)
            }),
        m("div.mt1", [
            m("button", { onclick: () => makeNewItem() }, "New Item"),
            m("button.ml1", { onclick: () => importMailbox() }, "Import Mailbox")
        ])
    ])
}

const OrganizerViewer = {
    view: function() {
        // console.log("view start")
        const result = m(".main.ma1", [
            nameTracker.displayNameEditor(),
            displayItems()
        ])
        // console.log("view done")
        return result
    }
}

p.connect({
    onLoaded: (streamId) => {
        if (isUUIDMatch(streamId, getOrganizerName())) {
            loading = false
        }
    }
})

// TODO: Fix this to clear out stuff for hash change
async function startup() {
    m.redraw()
}

m.mount(document.body, OrganizerViewer)
