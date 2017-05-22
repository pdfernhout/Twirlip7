// modal example

let modalVisible = false

function showModal(content) {
    return m("div", [
        m("div", {
            style: {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                "background-color": "rgba(0,0,0,0.6)",
                "z-index": 10000,
            }
        }),
        m("div", {
            style: {
                background: "#fff",
                border: "1px solid #eee",
                position: "fixed",
                top: "100px",
                left: "100px",
                width: "500px",
                height: "500px",
                "z-index": 10001,
            }
        }, [
            content, 
            m("br"), 
            m("button", {onclick: () => modalVisible = false}, "Close modal")
        ])
    ])
}

twirlip7.show(() => {
    return m("div", [
        m("button", {onclick: () => modalVisible = true}, "Open modal"),
        modalVisible ? showModal(m("div", ["My Modal", m("hr"), new Date().toISOString()])) : "Modal closed"
    ])
})
