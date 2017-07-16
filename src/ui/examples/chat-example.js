// Chat example
// This will add a lot of small messages to the notebook
// WIP Unfinished

var messages = []

const defaultChatRoom = "test"
const streamId = { chatRoom: defaultChatRoom }

var chatText = ""
var userID = "anonymous"

var App = {
    
    view: function () {
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


Twirlip7.show(App, { title: () => "Chat room: " + streamId.chatRoom } )
