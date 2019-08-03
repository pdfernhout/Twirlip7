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
            m("div.pa3", 
                m("span.ma3",
                    "User ID:",
                    m("input.ml1", {value: userID, oninput: userIDChange}),
                ),
            ),
            m("div.pa3",
                m("a.ma3", {href: "chat.html"}, "Test Chat"),
            ),
            m("div.ma3",
                m("a.ma3", {href: "ibis.html"}, "New IBIS diagram"),
                "(Bookmark the IBIS URL to return to it)",
            ),
            m("div.pa3",
                m("a.ma3", {href: "notebook.html"}, "Programmable Notebook"),
            )
        )
    }
}

m.mount(document.body, TwirlipAppList)
