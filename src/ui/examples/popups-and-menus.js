// This demonstrates displaying popups and menus

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

const popup1 = {
    isOpen: false,
    view: () => popup("My Popup 1", popup1, m("div", { style: { width: "24rem" } },
        m("button", { onclick: () => popup1.isOpen = false }, "one"),
        m("br"),
        m("button", { onclick: () => popup1.isOpen = false }, "two"),
        m("br"),
        m("button", { onclick: () => popup1.isOpen = false }, "three ----------------------- long -------------------"),
        m("br"),
        m("div",
            "Here is lots of content even with a ", m("a", { href: "#", onclick: () => popup1.isOpen = false  }, "link")
        )
    ))
}
    
const popup2 = {
    isOpen: false,
    view: () => popup("My Popup 2", popup2, m("div",
        m("button", { onclick: () => popup2.isOpen = false }, "three"),
        m("br"),
        m("button", { onclick: () => popup2.isOpen = false }, "four"),
        m("br"),
        m("button", { onclick: () => popup2.isOpen = false }, "five"),
        m("br"),
        m("div",
            "Here is more content with a ", m("a", { href: "#", onclick: () => popup2.isOpen = false  }, "link")
        )
    ))
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
            return m("div.hover-bg-light-blue", {
                onclick: () => {
                    menuState.isOpen = false
                    item.action()
                }
            }, item.name)
        })) : []
    )
}

const menu3 = {
    view: () => menu("My Menu 3", menu3),
    minWidth: "20rem",
    items: [
        { name: "one", action: () => console.log("one") },
        { name: "two", action: () => console.log("two") },
        { name: "three ----------------------- long -------------------", action: () => console.log("three") },
    ],
}

const menu4 = {
    view: () => menu("My Menu 4", menu4),
    items: [
        { name: "four", action: () => console.log("four") },
        { name: "five", action: () => console.log("five") },
        { name: "six", action: () => console.log("six") },
    ],
}

Twirlip7.show(() => {
    return [
        m(popup1),
        m("span", {style: "padding-left: 5rem"}),
        m(popup2),
        m("span", {style: "padding-left: 5rem"}),
        m(menu3),
        m("span", {style: "padding-left: 5rem"}),
        m(menu4)
    ]
})
