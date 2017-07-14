// Web page retrieval using server-side proxy support to get around CORS restrictions
// Proxying will only work if using the Twirlip7 server
// So, proxy requests won't work if running from GitHub and rawgit.com.
// You also need to know the proxyKey for the server

requirejs(["sanitizeHTML", "vendor/purify"], function(sanitizeHTML, DOMPurify) {

    let content
    
    // const url = "http://kurtz-fernhout.com/"
    const url = "http://pdfernhout.net/"
    
    const crossOriginService = "/api/proxy"
    
    const proxyKey = prompt("proxyKey?")
    if (!proxyKey) return
    
    m.request({
        method: "POST",
        url: crossOriginService,
        data: { url, proxyKey },
    }).then((result) => {
        console.log("result", result)
        if (result.success) {
            content = result.content
        } else {
            content = result.errorMessage
        }
        m.redraw()
    }).catch((error) => {
        console.log("An error occured:", error)
        content = "ERROR: " + error
        m.redraw()
    })
    
    Twirlip7.show(() => {
        return m("div", [
            content ?
                // Two examples of ways to sanitize web content for display locally -- but always a bit of a risk to display remote content
                sanitizeHTML.generateSanitizedHTMLForMithrilWithAttributes(m, DOMParser, content, {allowLinks: true, allowImages: true, allowIds: true, baseURL: url})
                // m.trust(DOMPurify.sanitize(content))
                : 
                "loading..."
        ])
    }, { title: url })
})
