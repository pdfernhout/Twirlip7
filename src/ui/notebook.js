"use strict"

/* global location, ace, io */

// Assumes ace is imported from script tag with noconflict version

// Assumes io is imported from socket.io

// Mithril only needs to be imported once in the application as it sets a global "m"
import "./vendor/mithril.js"

// sha256 only needs to be imported once in the application as it sets a global sha256
import "./vendor/sha256.js"

import { NotebookView } from "./NotebookView.js"
import { Stream } from "./Stream.js"
import { StreamBackendUsingLocalStorage } from "./StreamBackendUsingLocalStorage.js"
import { StreamBackendUsingServer } from "./StreamBackendUsingServer.js"
import { FileUtils } from "./FileUtils.js"
import { CanonicalJSON } from "./CanonicalJSON.js"

let initialKeyToGoTo = null

let notebookId = "common"

const NotebookUsingMemory = Stream()
const NotebookUsingLocalStorage = Stream(StreamBackendUsingLocalStorage())
const NotebookUsingServer = Stream(StreamBackendUsingServer(m.redraw, notebookId))

const modelistWrapper = {
    modelist: null
}

let notebookView = NotebookView(NotebookUsingLocalStorage, ace, modelistWrapper)

// TODO: improve import for ace somehow via ES6 probably by getting a new version of ace
ace.require(["ace/ext/modelist"], function(modelist) {
    modelistWrapper.modelist = modelist
    m.redraw()
})

function getItemForJSON(itemJSON) {
    if (itemJSON === null) return null
    if (itemJSON.startsWith("{")) {
        try {
            return JSON.parse(itemJSON)
        } catch(e) {
            // fall through
        }
    }
    const newItem = notebookView.newItem()
    newItem.value = itemJSON
    return newItem
}

function popup(popupName, popupState, popupContent) {
    return m("div.relative.dib", { onmouseleave: () => popupState.isOpen = false  },
        m("button", { onclick: () => popupState.isOpen = !popupState.isOpen }, popupName, m("span.ml2", "▾")),
        popupState.isOpen ? m("div.absolute.bg-white.shadow-2.pa1.z-1", {
            style: {
                display: (popupState.isOpen ? "block" : "none"),
                "min-width": popupState.minWidth || "100%"
            }
        }, popupContent) : []
    )
}

function menu(menuName, menuState) {
    return m("div.relative.dib", { onmouseleave: () => menuState.isOpen = false  },
        m("button", { onclick: () => menuState.isOpen = !menuState.isOpen }, menuName, m("span.ml2", "▾")),
        menuState.isOpen ? m("div.absolute.bg-white.shadow-2.pa1.z-1", {
            style: {
                display: (menuState.isOpen ? "block" : "none"),
                "min-width": menuState.minWidth || "100%"
            }
        }, menuState.items.map((item) => {
            const disabled = item.disabled && item.disabled()
            return m("div" + (disabled ? ".gray.bg-light-gray" : ".hover-bg-light-blue"), {
                onclick: () => {
                    menuState.isOpen = false
                    if (disabled) return
                    if (item.onclick) item.onclick()
                },
                title: item.title || ""
            }, item.name)
        })) : []
    )
}

function setupTwirlip7Global(callback) {
    // setup Twirlip7 global for use by evaluated code
    if (window.Twirlip7) {
        alert("Unexpected: Twirlip7 global already exists!")
        callback()
        return
    }
    window.Twirlip7 = {
        show: notebookView.show,
        icon: notebookView.icon,
        popup,
        menu,

        notebookView,

        // TODO: Remove legacy support for two forms of "workspace view"
        workspaceView: notebookView,
        WorkspaceView: notebookView,

        FileUtils,
        CanonicalJSON,
        NotebookUsingLocalStorage,
        NotebookUsingMemory,
        NotebookUsingServer,

        // TODO: Remove legacy support for previous development notes
        getCurrentJournal: () => {
            return notebookView.getCurrentNotebook()
        },

        getCurrentNotebook: () => {
            return notebookView.getCurrentNotebook()
        },

        getItemForJSON: getItemForJSON,
        newItem: notebookView.newItem,

        saveItem: (item) => {
            if (!item.timestamp) item.timestamp = new Date().toISOString()
            if (!item.contributor) item.contributor = notebookView.getCurrentContributor()
            const itemJSON = CanonicalJSON.stringify(item)
            return notebookView.getCurrentNotebook().addItem(itemJSON)
        },

        findItem(match, configuration) {
            // configuration: { includeMetadata: false, sortBy: "timestamp" (default) | "location" }
            // returns either array of items -- or if includeMetadata is truthy, {location, item, key}
            // TODO: This extremely computationally inefficient placeholder needs to be improved
            // TODO: This should not have to iterate over all stored objects
            if (!configuration) configuration = {}
            const result = []
            const notebook = notebookView.getCurrentNotebook()
            const count = notebook.itemCount()
            for (let i = 0; i < count; i++) {
                const index = i
                const itemJSON = notebook.getItemForLocation(i)
                const item = getItemForJSON(itemJSON)
                if (!item) return
                let isMatch = true
                for (let key in match) {
                    if (item[key] !== match[key]) {
                        isMatch = false
                        continue
                    }
                }
                if (isMatch) {
                    const key = notebook.keyForLocation(index)
                    result.push({location: index, item, key})
                }
            }
            // Sort so later items are earlier in list
            result.sort((a, b) => {
                if (!configuration.sortBy || configuration.sortBy === "timestamp") {
                    if (a.item.timestamp < b.item.timestamp) return 1
                    if (a.item.timestamp > b.item.timestamp) return -1
                } else if (configuration.sortBy === "location") {
                    if (a.location < b.location) return 1
                    if (a.location > b.location) return -1
                } else {
                    console.log("unexpected sortBy option", configuration.sortBy)
                }
                // compare on triple hash if timestamps match
                const aHash = a.key
                const bHash = b.key
                if (aHash < bHash) return 1
                if (aHash > bHash) return -1
                // Should never get here unless incorrectly storing duplicates
                console.log("duplicate item error", a, b)
                return 0
            })
            if (configuration.includeMetadata) return result
            return result.map(match => match.item)
        }
    }

    // Try to load socket.io, which may fail
    // requirejs(["/socket.io/socket.io.js"], function(io) {
    NotebookUsingServer.setOnLoadedCallback(function() {
        // assuming callback will always be done before get here to go to initialKeyToGoTo
        if (initialKeyToGoTo && notebookView.getNotebookChoice() === "server") {
            notebookView.goToKey(initialKeyToGoTo)
        } else {
            m.redraw()
        }
    })
    NotebookUsingServer.setup(io)
    callback()
    m.redraw()
    /*
    }).catch(error => {
        console.log("No socket.io available -- server function disabled")
        callback()
        m.redraw()
    })
    */
}

function runStartupItem(itemId) {
    try {
        const item = NotebookUsingLocalStorage.getItem(itemId)
        if (item) {
            try {
                const code = (item.startsWith("{")) ? JSON.parse(item).value : item
                // TODO: Could this cause issues if eval code is waiting on promises?
                eval(code)
                return "ok"
            } catch (error) {
                console.log("Error running startup item", itemId)
                console.log("Error message\n", error)
                console.log("Beginning of item contents\n", item.substring(0,500) + (item.length > 500 ? "..." : ""))
                return "failed"
            }
        } else {
            console.log("startup item not found", itemId)
            return "missing"
        }
    } catch(error) {
        console.log("Problem in runStartupItem", error)
        return "error"
    }
}

function runAllStartupItems() {
    const startupInfo = notebookView.getStartupInfo()
    if (startupInfo.startupItemIds.length) {
        setTimeout(() => {
            try {
                const invalidStartupItems = []
                for (let startupItemId of startupInfo.startupItemIds) {
                    const status = runStartupItem(startupItemId)
                    if (status !== "ok") {
                        console.log("Removing " +  status + " startup item from bootstrap: ", startupItemId)
                        invalidStartupItems.push(startupItemId)
                    }
                }
                if (invalidStartupItems.length) {
                    // disable any invalid startup items
                    for (let invalidStartupItemId of invalidStartupItems) {
                        const index = startupInfo.startupItemIds.indexOf(invalidStartupItemId)
                        if (index > -1) startupInfo.startupItemIds.splice(index, 1)
                    }
                    notebookView.setStartupInfo(startupInfo)
                }
            } catch(error) {
                console.log("Problem in runAllStartupItems", error)
            }
            m.redraw()
        })
    }
}

function startEditor(postMountCallback, preMountCallback) {
    if (preMountCallback) preMountCallback()
    const root = document.body
    m.mount(root, notebookView)
    setTimeout(() => {
        if (postMountCallback) {
            postMountCallback()
            m.redraw()
        }
        runAllStartupItems()
        window.addEventListener("hashchange", () =>  hashChange, false)
    }, 0)
}

function hashChange() {
    const hash = location.hash
    // do our own routing and ignore things that don't match in case other evaluated code is using Mithril's router
    if (hash && hash.startsWith("#item=")) {
        const itemId = hash.substring("#item=".length)
        if (notebookView.getCurrentItemId() !== itemId) {
            notebookView.goToKey(itemId)
        }
    }
    m.redraw()
}

window.addEventListener("hashchange", hashChange, false)

function startup() {
    setupTwirlip7Global(() => {

        notebookView.setCurrentContributor(localStorage.getItem("_contributor") || "")

        const hash = location.hash
        if (hash && hash.startsWith("#open=")) {
            const startupItemId = hash.substring("#open=".length)
            runStartupItem(startupItemId)
        } else if (hash && hash.startsWith("#item=")) {
            const itemId = hash.substring("#item=".length)
            initialKeyToGoTo = itemId
            startEditor(() => {
                if (initialKeyToGoTo && notebookView.getNotebookChoice() === "local storage") notebookView.goToKey(initialKeyToGoTo)
            }, () => {
                notebookView.restoreNotebookChoice()
            })
        } else if (hash && hash.startsWith("#eval=")) {
            // TODO: Not sure whether to restore notebook choice here
            const startupSelection = hash.substring("#eval=".length)
            const startupFileNames = startupSelection.split(";")
            for (let startupFileName of startupFileNames) {
                m.request({method: "GET", url: startupFileName, deserialize: value => value}).then(function (startupFileContents) {
                    eval(startupFileContents)
                })
            }
        } else if (hash && hash.startsWith("#edit=")) {
            // TODO: Not sure whether to restore notebook choice here
            const startupSelection = hash.substring("#edit=".length)
            m.request({method: "GET", url: startupSelection, deserialize: value => value}).then(function (startupFileContents) {
                startEditor(() => {
                    const currentItem = notebookView.getCurrentItem()
                    currentItem.entity = startupSelection
                    currentItem.attribute = "contents"
                    notebookView.setEditorContents(startupFileContents)
                })
            })
        } else {
            startEditor(() => {
                initialKeyToGoTo = notebookView.fetchStoredItemId()
                if (notebookView.getNotebookChoice() !== "server") notebookView.goToKey(initialKeyToGoTo)
            },() => {
                notebookView.restoreNotebookChoice()
            })
        }
    })
}

startup()
console.log("called startup")
