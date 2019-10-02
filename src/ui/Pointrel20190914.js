// Yet another version of Pointrel
// this one stores triples with the same a field in the same stream

import { StoreUsingServer } from "./StoreUsingServer.js"
import { UUID } from "./UUID.js"

import { CanonicalJSON } from "./CanonicalJSON.js"

let userID = localStorage.getItem("userID") || "anonymous"

function makeKey(jsonObject) {
    return CanonicalJSON.stringify(jsonObject)
}

const debugA = {}

const reverseLookupBs = {
    // Two big reasons to want to do a reverse lookup: 
    // * Finding a specific item by uniquely identifying
    // * Collecting a bunch of items by group classifying

    // "dct" is from Dublin Core kernel
    // https://www.dublincore.org/specifications/dublin-core/dc-kernel/
    
    // "owl" or "rdf" is inspired by OWL Web Ontology Language 
    // https://www.w3.org/TR/2004/REC-owl-semantics-20040210/#owl_sameAs
    "above": true,
    "after": true,
    "attended": true,
    "back": true,
    "backlink": true,
    "before": true,
    "below": true,
    "belongsTo": true,
    "child": true,
    "childOf": true,
    "class": "owl",
    "container": true,
    "creator": "dct",
    "contributor": "dct",
    "committer": true,
    "date": "dct",
    // "description": "dct"
    "domain": "rdf",
    "elementOf": true,
    "follows": true,
    "has": true,
    "hash": true,
    "id": true,
    "identifier": "dct",
    "in": true,
    "instanceOf": true,
    "inside": true,
    "isA": true,
    "isbn": true,
    "label": true,
    "link": true,
    "location": true,
    "name": true,
    "oneOf": "owl",
    "owner": true,
    "outside": true,
    "parent": true,
    "partOf": true,
    "publisher": "dct",
    "sha256": true,
    "spatial": "dct",
    "subject": "dct",
    "tag": true,
    "temporal": "dct",
    "title": "dct",
    "type": true,
    "url": true,
    "urn": true,
    "uuid": true,
    "visited": true,
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
        // console.log("addTripleToTripleIndex", triple)
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
        return UUID.uuidv4()
    }

    findC(a, b) {

        /*
        if (!debugA[JSON.stringify(a)]) {
            debugA[JSON.stringify(a)] = true
            console.log("findBC new A", a, b)
            if (JSON.stringify(a) === JSON.stringify({collageUUID:"1270111362741339979"})) throw new Error("debug")
        }
        */
    
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
    
        const timestamp = new Date().toISOString()
        const triple = {a, b, c, t: timestamp, u: userID}

        // Cache it locally first even if the server will echo it back eventually
        this.addTripleToTripleIndex(triple)

        this.backend.addItem(triple, a)

        if (reverseLookupBs[b]) {
            // console.log("ADD reverse lookup for", b)
            const reverseTriple = {a: {__reverseLookup: true, c: c, b: b}, b: {instance: a}, c: a, t: timestamp, u: userID}
            this.addTripleToTripleIndex(reverseTriple)
            this.backend.addItem(reverseTriple, reverseTriple.a)
        }
    }

    async addTripleAsync(a, b, c) {
        // console.log("addTriple", a, b, c)
    
        const triple = {a, b, c, t: new Date().toISOString(), u: userID}

        // Cache it locally first even if the server will echo it back eventually
        this.addTripleToTripleIndex(triple)

        await this.backend.addItemAsync(triple, a)
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

    findAs(b, c) {
        if (!reverseLookupBs[b]) throw new Error("findAs: reverse lookup not suported for: " +  CanonicalJSON.stringify(b))

        // Caution: objects that once matched (C B ?) may no longer match,
        // so you should ideally filter afterards for current matches if C could change for A B
        return Object.values(this.findBC({__reverseLookup: true, c: c, b: b}, "instance"))
    }

    connect(responder) {
        this.backend.connect({
            onAddItem: (item) => {
                // console.log("Pointrel20190914 onAddItem", item)
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

    isLoading() {
        return !this.backend.areAllStreamsLoaded()
    }
}
