// RSS Feed reader using server-side proxy support to get around CORS restrictions

// Derived from: 
// https://github.com/pdfernhout/Twirlip2/blob/master/source/webapp/ts/plugins-for-local-libre-or-standard-services/rss/rss-plugin.ts

"use strict"

/* global m, Twirlip7, requirejs */

// TODO: There seems to be some kind of occasional character encoding issue here, where & items end up displayed as codes not characters.
// TODO: Wondering if there is an issue where request converts to JSON and some character encoding is ignored?

requirejs(["sanitizeHTML", "vendor/purify"], function(sanitizeHTML, dompurify) {
    
    let proxyKey

    const sampleFeeds = [
        "http://static.fsf.org/fsforg/rss/news.xml",
        "http://portland.craigslist.org/sof/index.rss",
        "http://rss.cnn.com/rss/cnn_topstories.rss",
        "http://ma.tt/feed",
        "http://edinburghistoricalsociety.org/feed",
        "http://www.drfuhrman.com/rss/whatshappening.feed",
        "http://www.naturalnews.com/rss.xml",
        "http://scienceblogs.com/channel/life-science/feed/",
        "http://www.healthboards.com/boards/blogs/feed.rss",
        "http://www.freerepublic.com/tag/*/feed.rss",
        "http://www.democraticunderground.com/?com=rss&forum=latest",
        "http://gp.org/press/feed/sql2rss.php",
        "https://www.whitehouse.gov/feed/press",
        "http://www.nasa.gov/rss/dyn/breaking_news.rss",
        "https://soylentnews.org/index.rss"
    ]
    
    let testURL = sampleFeeds[0]
    
    let rssFeedInstance = {items: []}
    let fetchResult = { status: "idle" }
    let currentURL = ""
    let displayMode = "raw"
    let loadingError = ""
    let sourceContent = ""
    
    function apiRequestSend(apiURL, apiRequest, timeout_ms, successCallback, errorCallback) {
        fetchResult = { status: "pending" }
        
        const httpRequest = new XMLHttpRequest()
    
        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState === 4) {
                if (httpRequest.status >= 200 && httpRequest.status < 300) {
                    if (successCallback) {
                        const response = JSON.parse(httpRequest.responseText)
                        successCallback(response)
                    }
                } else {
                    // TODO: Might these sometimes be JSON?
                    if (errorCallback) errorCallback({ status: httpRequest.status, message: httpRequest.responseText })
                }
            }
        }
    
        httpRequest.ontimeout = function() {
            errorCallback({ status: 0, message: "Timeout" })
        }
        
        const contentType = "application/json; charset=utf-8"
        const data = JSON.stringify(apiRequest)
    
        httpRequest.open("POST", apiURL, true)
    
        httpRequest.setRequestHeader("Content-Type", contentType)
        httpRequest.setRequestHeader("Accept", "application/json")
        httpRequest.timeout = timeout_ms || 10000
    
        httpRequest.send(data)
    }
    
    function getField(node, fieldName, defaultValue) {
        const nodes = node.getElementsByTagName(fieldName)
        // console.log("nodes", fieldName, nodes)
        if (nodes && nodes.length && nodes[0].childNodes.length) return nodes[0].childNodes[0].nodeValue
        return defaultValue
    }
    
    function parseRSS(xmlText) {
        const parser = new DOMParser()
        
        let xmlDoc
        
        // console.log("about to try to parse XML")
        try {
            xmlDoc = parser.parseFromString(xmlText, "text/xml")
            // console.log("xmlDoc", xmlDoc)
        } catch (error) {
            console.log("error parsing xml", error)
            loadingError = "error parsing xml: " + JSON.stringify(error)
            return { items: [] }
        }
        
        const itemNodes = xmlDoc.getElementsByTagName("item")
        
        const items = []
        
        for (let i = 0; i < itemNodes.length; i++) {
            const itemNode = itemNodes[i]
            items.push({
                title: getField(itemNode, "title", ""),
                description: getField(itemNode, "description", ""),
                link: getField(itemNode, "link", ""),
                date: getField(itemNode, "date", "")
            })
        }
        
        return {
            items: items
        }
    }
    
    function newURL(url) {
        console.log("newURL", url)
        currentURL = url
        loadingError = ""
        sourceContent = ""
        rssFeedInstance = {items: []}
        if (displayMode === "very unsafe html") displayMode = "images"
        // TODO: m.request({method: "POST", url: "/api/proxy"}).then( ...
        apiRequestSend("/api/proxy", { url, proxyKey }, 10000, (result) => {
            fetchResult = { status: result.status }
            if (result.success) {
                sourceContent = result.content
                // console.log("sourceContent", sourceContent)
                rssFeedInstance = parseRSS(sourceContent)
                // console.log("proxy request success", result)
            } else {
                fetchResult.errorMessage = result.errorMessage
            }
            m.redraw()
        }, (failed) => {
            console.log("proxy request failed", failed)
            loadingError = JSON.stringify(failed)
            fetchResult = { status: "failed" }
            m.redraw()
        })
    }
    
    function displayModeChange(newMode) {
        console.log("displayModeChange", newMode)
        displayMode = newMode
    }
    
    function displayModeChooser() {
        const result = ["document", "raw", "basic html", "images", "dompurify", "very unsafe html"].map((mode) => {
            const selected = (displayMode === mode) ? "*" : ""
            return [ m("button", {onclick: displayModeChange.bind(null, mode)}, selected + mode + selected)]
        })
        
        return m("div.ma2", result)
    }
    
    function displayDescription(description) {
        // "document" option is handled elsewhere
        // if (displayMode === "alternative") return sanitizeHTML.generateSanitizedHTMLForMithrilWithoutAttributes(m, description)
        // if (displayMode === "tags") return sanitizeHTML.generateSanitizedHTMLForMithrilWithAttributes(m, DOMParser, description, {})
        if (displayMode === "basic html") return sanitizeHTML.generateSanitizedHTMLForMithrilWithAttributes(m, DOMParser, description, {allowLinks: true})
        if (displayMode === "images") return sanitizeHTML.generateSanitizedHTMLForMithrilWithAttributes(m, DOMParser, description, {allowLinks: true, allowImages: true})
        if (displayMode === "dompurify") return m.trust(dompurify.sanitize(description))
        if (displayMode === "very unsafe html") return m.trust(description)
        if (displayMode !== "raw") console.log("unexpected displayMode:", displayMode)
        return description
    }
    
    function displayItem(item) {
        const title = item.title
        const link = item.link
        const description = item.description
        const timestamp = item.date
    
        return m("div.item", [
            m("br"),
            m("strong", title),
            " ", timestamp,
            m("br"),
            displayDescription(description),
            " ",
            m("a", { href: link }, "More ..."),
            m("br")
        ])
    }
    
    function displayRSS() {
        return m("div.feed", [
            m("span.ml2", "URL:"),
            m("input.ml1", {onchange: m.withAttr("value", newURL), value: currentURL, size: "80"}),
            m("div.ma2", JSON.stringify(fetchResult)),
            displayMode === "document" ?
                [sourceContent, m("br")] :
                [
                    rssFeedInstance.items.map(displayItem),
                    rssFeedInstance.items.length === 0 ? m("div.ma2", "No entries found") : []
                ],
            loadingError ? m("div.ma2", ["Loading error: ", loadingError]) : []
        ])
    }
    
    const DropDownFeedChooser = {
        view: function() {
            return m("select", { onchange: m.withAttr("value", newURL.bind(null)) }, [
                m("option", { value: "" }, "[Choose an example RSS feed to load]"),
                sampleFeeds.map((url) => {
                    return m("option", { value: url }, url)
                })
            ])
        }
    }
    
    function displayFeedChooser() {
        // return sampleFeeds.map((url) => [ m("button", {onclick: newURL.bind(null, url)}, "V"), " ", url, m("br")])
        return m(DropDownFeedChooser)
    }
    
    function display() {
        return m("div", [
            m("h4.strong.ma2", "RSS feed reader"),
            m("button.ma2", { onclick: () => proxyKey = prompt("proxyKey?") }, "Set proxyKey required by server"),
            m("br"),
            m("span.ma2", "Example RSS feeds:"),
            displayFeedChooser(),
            displayModeChooser(),
            displayRSS()
        ])
    }
    
    Twirlip7.show(display)
})
