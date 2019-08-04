// Assumes caller defines global "m" for Mithril

export function popup(popupName, popupState, popupContent) {
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

export function menu(menuName, menuState) {
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