// Web page retrieval using server-side proxy support to get around CORS restrictions

requirejs(["sanitizeHTML", "vendor/purify"], function(sanitizeHTML, DOMPurify) {

    let content
    
    // const url = "http://kurtz-fernhout.com/"
    const url = "http://pdfernhout.net/"
    
    const crossOriginService = "/api/proxy"
    
    m.request({
        method: "POST",
        url: crossOriginService,
        data: { url },
    }).then((result) => {
        console.log("result", result)
        content = result.content
        m.redraw()
    }).catch((error) => {
        console.log("An error occured:", error)
        content = JSON.stringify(error)
        m.redraw()
    })
    
    Twirlip7.show(() => {
        return m("div", [
            content ?
                // Two examples of ways to sanitize web content for display locally -- but always a bit of a risk to display remote content
                sanitizeHTML.generateSanitizedHTMLForMithrilWithAttributes(m, DOMParser, content, {allowLinks: true, allowImages: true, baseURL: url})
                // m.trust(DOMPurify.sanitize(content))
                : 
                "loading..."
        ])
    }, { title: url })
})
