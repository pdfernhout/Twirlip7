"use strict"
/* global m */
/* eslint-disable no-console */

function displayItems() {
    return "Nothing to display yet"
}

const TwirlipChat = {
    view: function() {

        return m("main.ba.ma2.pa2", [
            m("h1", {class: "title"}, "twirlip12 chat app"),
            displayItems()
        ])
    }
}


window.onload = () => m.mount(document.body, TwirlipChat)
