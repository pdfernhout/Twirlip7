// Soylent news article reader

"use strict"
/* global m, requirejs, Twirlip7 */

requirejs(["sanitizeHTML", "vendor/purify"], function(sanitizeHTML, DOMPurify) {
    
    const proxyKey = prompt("proxyKey?")
    if (!proxyKey) return

    // Quit reading news url
    const url = "https://soylentnews.org/article.pl?sid=16/12/13/0353212"
    
    // 3D printer URL
    // const url = "https://soylentnews.org/article.pl?sid=16/12/14/239229"
    
    var App = {
        
        url: url,
        article: "Loading...",
        comments: [],
        
        view: function () {
            return m("div.pa4", [
                m("div", "Soylent News Article Reader on: ", m("a", { href: App.url }, App.url)),
                m("div", App.article),
                m("div", "======================================="),
                m("div", App.comments)
            ])
        }
    }
    
    const crossOriginService = "/api/proxy"
    
    m.request({
        method: "POST",
        url: crossOriginService,
        data: { url: App.url, proxyKey },
    }).then((response) => {
        console.log(response)
        const parser = new DOMParser()
        const htmlDoc = parser.parseFromString(response.content, "text/html")
        console.log("htmlDoc", htmlDoc)
        let article = htmlDoc.querySelector(".article")
        console.log("article", article)
        App.article = m.trust(DOMPurify.sanitize(article.innerHTML))
        let comments = htmlDoc.querySelector("#commentlisting").querySelectorAll("li")
        App.comments = []
        for (let i = 0; i < comments.length; i++) {
            App.comments.push(m.trust(DOMPurify.sanitize(comments[i].innerHTML)))
        }
        m.redraw()
    }).catch((error) => {
        console.log("Problem with request operation: " + error.message, error)
    })
    
    Twirlip7.show(App, { title: "Soylent News article reader on: " + App.url })
})
