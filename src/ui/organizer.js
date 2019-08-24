"use strict"
/* eslint-disable no-console */

import NameTracker from "./NameTracker.js"
import FileUtils from "./FileUtils.js"
import p from "./pointrel20171122.js"
import m from "./mithril.v1.1.6.js"

p.setDefaultApplicationName("organizer")

const nameTracker = new NameTracker({
    hashNameField: "name",
    displayNameLabel: "Name",
    defaultName: "organizer",
    nameChangedCallback: startup
})

function getOrganizerName() {
    if (!nameTracker.name || nameTracker.name === "organizer") return "organizer"
    return "organizer:" + nameTracker.name
}

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

    getBody() {
        return p.findC(this.uuid, "body") || ""
    }

    setBody(body) {
        p.addTriple(this.uuid, "body", body)
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

    addItem(item) {
        p.addTriple(getOrganizerName(), {item: item.uuid}, item.uuid)
    }

    deleteItem(item) {
        p.addTriple(getOrganizerName(), {item: item.uuid}, null)
    }
}

let organizer = new Organizer()

function makeNewItem() {
    const item = new Item()
    organizer.addItem(item)
}

function importMailbox() {
    FileUtils.loadFromFile((name, contents) => {
        console.log("importMailbox", name)
        const emails = contents.split(/^From /m)
        for (let email of emails) {
            if (!email || email === " ") continue
            // email = email.replace(/^>From /m, "From ")
            email = "From " + email
            // console.log("email", email)
            const subject = email.match(/^Subject: ([^\n]*)/m)
            const title = subject ? subject[1] : ""
            console.log("subject", title)
            //console.log("==============================")
            p.newTransaction("organizer/importMailbox")
            const item = new Item()
            item.setTitle(title)
            item.setBody(email)
            item.setType("email:mbox")
            organizer.addItem(item)
            p.sendCurrentTransaction()
            m.redraw()
        }
    })
}

let currentUUID = null
let editMode = false

function displayItemEditor(item) {
    return m("div.ba.bw1.pa1", [
        m("span", "UUID: ", " ", item.uuid),
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
    rest = rest.trim()
    return m("div.ba.bw1.pa1", [
        headers ? [
            m("button.f6.mr1", { onclick: () => showHeaders[item.uuid] = !showHeaders[item.uuid] }, "Headers"),
        ] : [],
        m("span", "UUID: ", " ", item.uuid),
        showHeaders[item.uuid] ? m("pre", headers) : [],
        m("pre", rest),
    ])

}

function displayItem(item, index) {
    const body = item.getBody()
    const fromMatch = body.match(/^From: ([^\n]*)/m)
    const from = fromMatch ? fromMatch[1] : ""
    const fromName = (from.split(" <")[0] || "").replace(/"/g, "")
    const fromEmail = "<" + (from.split(" <")[1] || ">")
    const dateMatch = body.match(/^Date: ([^\n]*)/m)
    const date = dateMatch ? dateMatch[1] : ""
    return m("div.mt1", {key: item.uuid}, [
        m("button.f6", {onclick: () => {
            currentUUID = (currentUUID === item.uuid && !editMode) ? null : item.uuid
            editMode = false
        }}, "Show"),
        m("button.ml1.mr1.f6", {onclick: () => {
            currentUUID = (currentUUID === item.uuid && editMode) ? null : item.uuid
            editMode = true
        }}, "Edit"),
        m("span.dib.w2.tr", index), " ", 
        m("span.ml2", { title: date }, item.getTitle()),
        m("span.ml2.f6", { title: fromEmail }, fromName),
        m("br"),
        (item.uuid === currentUUID && editMode) ? displayItemEditor(item) : [],
        (item.uuid === currentUUID && !editMode) ? displayItemContents(item) : []
    ])
}

function displayItems() {
    const items = organizer.getItems()
    let index = 0
    return m("div.ma1", [
        items.reverse().map((item) => {
            return displayItem(item, index++)
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
            p.isOffline() ? m("div.h2.pa1.ba.b--red", "OFFLINE", m("button.ml1", { onclick: p.goOnline }, "Try to go online")) : [],
            nameTracker.displayNameEditor(),
            p.isLoaded() ?
                displayItems() :
                "Loading... " + (p.getLastSequenceRead() || "")
        ])
        // console.log("view done")
        return result
    }
}

async function startup() {
    p.setRedrawFunction(m.redraw)
    p.setShareName(getOrganizerName())
    await p.updateFromStorage(true)
    m.redraw()
}

m.mount(document.body, OrganizerViewer)

startup()
