// Yet another version of Pointrel
// this one stores triples with the same a field in the same stream

import { StoreUsingServer } from "./StoreUsingServer.js"

export function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

import { CanonicalJSON } from "./CanonicalJSON.js"

let userID = localStorage.getItem("userID") || "anonymous"

function makeKey(jsonObject) {
    return CanonicalJSON.stringify(jsonObject)
}

export class Pointrel20190914 {
    
    constructor(redrawFunction) {
        this.tripleIndex = {}
        this.latestSHA256 = null
        this.latestSequence = null
        redrawFunction = redrawFunction || m.redraw
        this.backend = StoreUsingServer(redrawFunction, undefined, userID)
    }

    addTripleToTripleIndex(triple) {
        const aKey = makeKey(triple.a)
        let aIndex = this.tripleIndex[aKey]
        if (!aIndex) {
            aIndex = {}
            this.tripleIndex[aKey] = aIndex
        }

        const bKey = makeKey(triple.b)
        let bIndex = aIndex[bKey]
        if (!bIndex || bIndex.t < triple.t) {
            bIndex = {c: triple.c, t: triple.t}
            aIndex[bKey] = bIndex
        }
    }

    uuidv4() {
        return uuidv4()
    }

    findC(a, b) {
    
        // console.log("this.tripleIndex", this.tripleIndex)
        const aKey = makeKey(a)
        const aIndex = this.tripleIndex[aKey]
        if (aIndex) {
            const bKey = makeKey(b)
            const bIndex = aIndex[bKey]
            if (bIndex) return bIndex.c
        } else {
            this.tripleIndex[aKey] = {}
            this.backend.openStream(a)
        }
    
        return undefined
    }
    
    addTriple(a, b, c) {
        // console.log("addTriple", a, b, c)
    
        const triple = {a, b, c, t: new Date().toISOString(), u: userID}

        // Cache it locally first even if the server will echo it back eventually
        this.addTripleToTripleIndex(triple)

        this.backend.addItem(triple, a)
    }

    // setId is optional
    findBC(a, setId) {
        const result = {}

        const aKey = makeKey(a)

        const aIndex = this.tripleIndex[aKey]
        if (aIndex) {
            const keys = Object.keys(aIndex)
            for (let bKey of keys) {
                if (result[bKey] === undefined) {
                    if (!setId || JSON.parse(bKey)[setId]) {
                        result[bKey] = aIndex[bKey].c
                    }
                }
            }
        } else {
            this.tripleIndex[aKey] = {}
            this.backend.openStream(a)
        }

        return result
    }

    connect(responder) {
        this.backend.connect({
            onAddItem: (item) => {
                // console.log("onAddItem", item)
                if (item.a !== undefined && item.b !== undefined && item.c !== undefined && item.t !== undefined) {
                    this.addTripleToTripleIndex(item)
                }
                if (responder && responder.onAddItem) {
                    responder.onAddItem(item)
                }
            },
            onLoaded: (streamId) => {
                if (responder && responder.onLoaded) {
                    responder.onLoaded(streamId)
                }
            }
        })
        try {
            console.log("backend setup start")
            this.backend.setup()
        } catch(e) {
            alert("This app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
        }
    }
}
