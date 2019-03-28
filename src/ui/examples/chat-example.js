// Chat example
// This will add a lot of small messages to the notebook
// WIP Unfinished

var messages = []

const defaultChatRoom = "test"
const streamId = { chatRoom: defaultChatRoom }

var chatText = ""
var userID = "anonymous"

let cacheItemsProcessedCount = 0
let cachedNotebook = null
let cache = {}
let processingNewItemsPromise = null

function processNewNotebookItemRecursive(callback, i) {
    if (i >= cachedNotebook.itemCount()) {
        processingNewItemsPromise = null
        return Promise.resolve(true)
    }
    return cachedNotebook.getItemForLocation(i).then((item) => {
        cacheItemsProcessedCount++
        if (item) {
            return cachedNotebook.keyForLocation(i).then((key) => {
                callback({i, key, item: Twirlip7.getItemForJSON(item) })
                return processNewNotebookItemRecursive(callback, i + 1)
            })
        } else {
            // Should never get here...
            return processNewNotebookItemRecursive(callback, i + 1)
        }
    }).catch(() => {
        processingNewItemsPromise = null
        return Promise.resolve(false)
    })
}

function processNewNotebookItems(callback, startIndex) {
    if (processingNewItemsPromise) return processingNewItemsPromise
    if (!startIndex) startIndex = 0
    processingNewItemsPromise = processNewNotebookItemRecursive(callback, startIndex)
    return processingNewItemsPromise
}

function updateCacheIfNeeded() {
    const currentNotebook = Twirlip7.getCurrentNotebook()
    const promise = processingNewItemsPromise || Promise.resolve(true)
    promise.then(() => {
        if (cachedNotebook !== currentNotebook) {
            cachedNotebook = currentNotebook
            cache = {}
            cacheItemsProcessedCount = 0
        }
        const currentItemCount = cachedNotebook.itemCount()
        console.log("currentItemCount", currentItemCount)
        if (cacheItemsProcessedCount < currentItemCount) {
            processNewNotebookItems(addToMessages, cacheItemsProcessedCount)
            cacheItemsProcessedCount++
            m.redraw()
        }
    })
}

function addToMessages(itemContext) {
    const entity = itemContext.item.entity
    const attribute = itemContext.item.attribute
    const message = { timestamp: new Date().toISOString(), userID: "id", chatText: itemContext.key }
    messages.push(message)
}

var App = {

    view: function () {
        updateCacheIfNeeded()
        return m("div", [
            m("h4.tc", "Twirlip Chat"),
            m("div.ma1",
                m("span.dib.tr.w4", "Chat room:"),
                m("input", {value: streamId.chatRoom, onchange: chatRoomChange})
            ),
            m("div.ma1",
                m("span.dib.tr.w4", "User ID:"),
                m("input", {value: userID, onchange: userIDChange})
            ),
            messages.map(function (message) {
                var localeTimestamp = new Date(Date.parse(message.timestamp)).toLocaleString()
                return m("div", [
                    m("span", {title: localeTimestamp, style: "font-size: 50%;"}, message.userID + ":"),
                    " ",
                    message.chatText
                ])
            }),
            m("br"),
            m("textarea", {value: chatText, onchange: chatTextChange}),
            m("button", {onclick: sendChatMessage}, "Send")
        ])
    }
}

function chatRoomChange(e) {
    streamId.chatRoom = e.currentTarget.value
    requestAllMessages()
}

function userIDChange(e) {
    userID = e.currentTarget.value
}

function chatTextChange(e) {
    chatText = e.currentTarget.value
}

function sendChatMessage() {
    const timestamp = new Date().toISOString()
    const command = "insert"
    sendMessage({ command, streamId, chatText, userID, timestamp })
    chatText= ""
}

function messageReceived(message) {
    console.log("messageReceived", message)
    if (message.command === "insert") {
        messages.push(message)
    } else if (message.command === "remove") {
        console.log("TODO: Remove message not handled")
    } else if (message.command === "reset") {
        // TODO: Should handle timestamps somehow, so earlier messages before last reset are rejected
        messages = []
    }
    // TODO: remove
}

function sendMessage(message) {
    Twirlip7.getCurrentNotebook().addItem(Twirlip7.CanonicalJSON.stringify(message)).then((storedItem) => {
        console.log("stored as", storedItem)
    }).catch((error) => {
        console.log("Send failed with error", error)
    })
}

Twirlip7.show(App, { title: () => "Chat room: " + streamId.chatRoom } )
