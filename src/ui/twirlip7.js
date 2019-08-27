/* global m, io, marked, Push, sha256 */
/* eslint-disable no-console */

"use strict"

// defines m
import "./vendor/mithril.js"

let userID = localStorage.getItem("userID") || "anonymous"

function userIDChange(event) {
    userID = event.target.value
    localStorage.setItem("userID", userID)
}

const TwirlipAppList = {
    view: function () {
        return m("div.ma4",
            m("div.pa3.f3", "Twirlip7 helps you organize information you find interesting and make it accessible and useful to yourself or others you want to share with."),
            m("div.pa3", 
                m("span.ma3",
                    "User ID:",
                    m("input.ml1", {value: userID, oninput: userIDChange}),
                ),
                (!userID || userID === "anonymous") && "(Please enter a user ID you'd like to use.)"
            ),
            m("div.ma3",
                m("a.ma3", {href: "chat.html"}, "Chat"),
            ),
            m("div.ma3",
                m("a.ma3", {href: "notebook.html"}, "Programmable Notebook"),
                "(can run without a server)"
            ),
            m("div.ma3",
                m("a.ma3", {href: "ibis.html"}, "IBIS diagram"),
                "(bookmark the randomly created IBIS URL to return to it)",
            ),
            m("div.ma3",
                m("a.ma3", {href: "tables.html"}, "Spreadsheet Tables"),
            ),
            m("div.ma3",
                m("a.ma3", {href: "filer.html"}, "Filer"),
            ),
            m("div.ma3",
                m("a.ma3", {href: "organizer.html"}, "Organizer"),
                "(intended for email eventually)"
            ),
            m("div.ma3",
                m("a.ma3", {href: "outliner.html"}, "Outliner"),
            ),
            m("div.ma3",
                m("a.ma3", {href: "sketcher.html"}, "Sketcher"),
            ),
            m("div.ma3",
                m("a.ma3", {href: "monitor.html"}, "Stream Monitor"),
            ),
        )
    }
}

m.mount(document.body, TwirlipAppList)
