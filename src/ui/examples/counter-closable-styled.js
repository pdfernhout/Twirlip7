// This is a modification of the previous example which adds some styling using the Tachyons CSS library.
// Tachyons predefines many classes which do common CSS tasks.
// You can add these classes to your div using the Mithril ".cssClass" notation after the HTML tag name.
// If there is no leading tag name before the CSS classes, Mithril assumes it is a "div".

// You can click on the Tachyons.css link near the top of this page later to learn more about Tachyons.
// The "Tachyons" part of the link goes to the Tachyons website to get an overview of what is possible.
// The ".css" part of the link goes to the the CSS source file for Tachyons where you can look up class names.
// Using Tachyons plus occasional inline styles makes it possible to do styled UIs with only JavaScript coding.

var div = document.createElement("div")

var state = {
    count: 0,
    inc: function() {state.count++}
}

var Counter = {
    view: function() {
        return m("div.ba.ma3.pa3.bg-light-purple",
            m("button.fr", {onclick: function () { m.mount(div, null); document.body.removeChild(div) } }, "X"),
            m("div.ma2.f3", {onclick: state.inc}, state.count)
        )
    }
}

document.body.appendChild(div)
m.mount(div, Counter)
