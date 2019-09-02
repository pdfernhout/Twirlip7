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
    return m("div.relative.dib",
        { 
            onmouseleave: () => menuState.isOpen = false
        },
        m("button", { 
            onclick: (event) => {
                menuState.isOpen = !menuState.isOpen 
                const buttonBounds = event.target.getBoundingClientRect()
                // TODO: Fix klunky menuHeight and menuWidth calculation assuming font size and padding
                const menuHeight = 20 * (menuState.items.length + 2)
                const menuWidth = 400
                if (buttonBounds.bottom + menuHeight > window.innerHeight) {
                    menuState.shouldDisplayAbove = true
                } else {
                    menuState.shouldDisplayAbove = false
                }
                if (buttonBounds.left + menuWidth > window.innerWidth && (buttonBounds.right - 400) >= 0) {
                    menuState.shouldDisplayToLeft = true
                } else {
                    menuState.shouldDisplayToLeft = false
                }
            }
        }, menuName, m("span.ml2", "▾")),
        menuState.isOpen ? m("div.absolute.bg-white.shadow-2.pa1.z-1", {
            style: {
                right: menuState.shouldDisplayToLeft ? 0: undefined,
                bottom: menuState.shouldDisplayAbove ? "1.25rem" : undefined,
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