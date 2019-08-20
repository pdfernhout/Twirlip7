"use strict"

import { HashUtils } from "./HashUtils.js"

// defines m
// import "./vendor/mithril.js"

export default class NameTracker {

    constructor(options) {
        this.name = ""
        this.nameChangedCallback = null
        this.hashNameField = "name"
        this.displayNameLabel = "Name"
        this.defaultName = "test"
        this.doUpdateTitle = true
        this.doStartup = true
        if (options) Object.assign(this, options)
        if (this.doStartup) this.startup()
    }

    startup() {
        this.name = HashUtils.getHashParams()[this.hashNameField] || this.defaultName
        window.onhashchange = () => this.updateNameFromHash()
        this.updateTitleForName()
    }

    updateTitleForName() {
        if (!this.doUpdateTitle) return
        const title = document.title.split(" -- ")[0]
        document.title = title + " -- " + this.name
    }

    updateNameFromHash() {
        const hashParams = HashUtils.getHashParams()
        const newName = hashParams[this.hashNameField] || this.defaultName
        if (newName !== this.name) {
            this.name = newName
            if (this.nameChangedCallback) this.nameChangedCallback()
            this.updateTitleForName()
        }
    }

    updateHashForName() {
        const hashParams = HashUtils.getHashParams()
        hashParams[this.hashNameField] = this.name
        HashUtils.setHashParams(hashParams)
        this.updateTitleForName()
    }

    updateClicked() {
        this.updateHashForName()
        if (this.nameChangedCallback) this.nameChangedCallback()
    }

    onNameInputKeyDown(event) {
        if (event.keyCode === 13) {
            event.preventDefault()
            this.name = event.target.value
            this.updateClicked()
        } else {
            event.redraw = false
        }
    }

    displayNameEditor() {
        return [
            this.displayNameLabel,
            ":",
            m("input.ml1", { 
                value: this.name,
                onkeydown: (event) => this.onNameInputKeyDown(event),
                onchange: (event) => this.name = event.target.value
            }),
            m("button.ml1", { onclick: () => this.updateClicked() }, "Update"),
            m("br"),
        ]
    }
}

/* example use:
const nameTracker = new NameTracker({
    hashNameField: "sketch",
    displayNameLabel: "Sketch",
    defaultName: "test3",
    nameChangedCallback: updateSketch
})
*/
