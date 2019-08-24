/* global io, sha256 */

// Assumes socket.io loaded from script tag to define io

import { StreamBackendUsingServer } from "./StreamBackendUsingServer.js"

// defines sha256
import "./vendor/sha256.js"
const calculateSHA256 = sha256

export function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == "x" ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

let userID = localStorage.getItem("userID") || "anonymous"

export class Pointrel20190820 {
    
    constructor() {
        this.tripleIndex = {}
        this.indexedTransactions = {}
        this.latestSHA256 = null
        this.latestSequence = null
        this.streamId = null
        this._isLoaded = false
        this.backend = StreamBackendUsingServer(m.redraw, this.streamId, userID)

        this.redrawFunction = null
        this.currentTransaction = null

        // The "application" name is a debugging hint about what app made the transaction and why
        // use "app/method" for more details
        this.defaultApplicationName = "test"
    }

    newTransaction(application) {
        // The "application" is a debugging hint about what app made the transaction and why -- use "app/method" for more details
        if (!application) application = this.defaultApplicationName
        if (this.currentTransaction) {
            throw new Error("Transaction already in progress")
        }
        this.currentTransaction = {
            previous: undefined,
            sequence: undefined,
            application,
            triples: [],
            type: "triples"
        }
    }
    
    sendCurrentTransaction() {
        // TODO -- Faking it for now, copying a little code from processNextSend
        const transaction = this.currentTransaction
        const latest = this.getLatestSHA256()
        // const latestTransaction = latest ? await getTransactionFromCache(latest) : null
        const latestTransaction = latest ? this.indexedTransactions[latest] : null
        const sequence = latestTransaction ? latestTransaction.sequence + 1 : 0 
        transaction.previous = latest
        transaction.sequence = sequence    
        const sha256 = calculateSHA256(JSON.stringify(this.currentTransaction))
        this.addTransactionToTripleIndex(sha256, this.currentTransaction)

        console.log("TODO sendCurrentTransaction")
        // TODO: sendQueue.push(currentTransaction)
        setTimeout(() => this.backend.addItem(transaction), 10)
        this.currentTransaction = null
        this.setLatest(sha256, transaction)
        // TODO if (!sending) processNextSend()
    }
    
    cancelCurrentTransaction() {
        this.currentTransaction = null
    }

    addTransactionToTripleIndex(sha256, transaction) {
        if (!transaction) {
            console.log("missing transaction")
            return
        }
        if (this.indexedTransactions[sha256]) {
            console.log("transaction already indexed", sha256, transaction)
            return
        }
        if (transaction.type === "triples") {
            const triples = transaction.triples
            // Most recent triples are at end
            for (let i = triples.length - 1; i >= 0; i--) {
                const triple = triples[i]
                let aIndex = this.tripleIndex[triple.a]
                if (!aIndex) {
                    aIndex = {}
                    this.tripleIndex[triple.a] = aIndex
                }
                const bJSON = JSON.stringify(triple.b)
                let bIndex = aIndex[bJSON]
                if (!bIndex) {
                    bIndex = {c: triple.c, sequence: transaction.sequence}
                    aIndex[bJSON] = bIndex
                } else {
                    if (bIndex.sequence < transaction.sequence) {
                        bIndex.c = triple.c
                        bIndex.sequence = transaction.sequence
                    }
                }
            }
        }
        // Kludge to use memory storage
        this.indexedTransactions[sha256] = transaction
        // this.indexedTransactions[sha256] = true
    }

    getLatestSHA256() {
        return this.latestSHA256
    }
    
    setLatest(sha256, newTransaction) {
        if (newTransaction.sequence === undefined || newTransaction.sequence === null) return
        if (this.latestSequence !== null && this.latestSequence >= newTransaction.sequence) return
        this.latestSHA256 = sha256
        this.latestSequence = newTransaction.sequence
    }

    setDefaultApplicationName(name) {
        this.defaultApplicationName = name
    }

    uuidv4() {
        return uuidv4()
    }

    findC(a, b) {
        /*
        // first check any pending transactions -- most recent are at end
        for (let queueIndex = sendQueue.length - 1; queueIndex >= 0; queueIndex--) {
            const transaction = sendQueue[queueIndex]
            if (transaction.type === "triples") {
                const triples = transaction.triples
                // Most recent triples are at end
                for (let i = triples.length - 1; i >= 0; i--) {
                    const triple = triples[i]
                    if (triple.a === a && triple.b === b) return triple.c
                }
            }
        }
        */
    
        // console.log("this.tripleIndex", this.tripleIndex)
        const aIndex = this.tripleIndex[a]
        if (aIndex) {
            const bJSON = JSON.stringify(b)
            const bIndex = aIndex[bJSON]
            if (bIndex) return bIndex.c
        }
    
        return undefined
    }
    
    addTriple(a, b, c) {
        console.log("addTriple", a, b, c)
    
        const triple = {a, b, c}
    
        if (this.currentTransaction) {
            this.currentTransaction.triples.push(triple)
        } else {
            this.newTransaction()
            this.currentTransaction.triples.push(triple)
            this.sendCurrentTransaction()
        }
    }

    // setId is optional
    findBC(a, setId) {
        const result = {}

        /*
        // first check any pending transactions -- most recent are at end
        for (let queueIndex = sendQueue.length - 1; queueIndex >= 0; queueIndex--) {
            const transaction = sendQueue[queueIndex]
            if (transaction.type === "triples") {
                const triples = transaction.triples
                // Most recent triples are at end
                for (let i = triples.length - 1; i >= 0; i--) {
                    const triple = triples[i]
                    const bJSON = JSON.stringify(triple.b)
                    if (triple.a === a && result[bJSON] === undefined) {
                        if (!setId || triple.b[setId]) {
                            result[bJSON] = triple.c
                        }
                    }
                }
            }
        }
        */

        const aIndex = this.tripleIndex[a]
        if (aIndex) {
            const keys = Object.keys(aIndex)
            for (let bJSON of keys) {
                if (result[bJSON] === undefined) {
                    if (!setId || JSON.parse(bJSON)[setId]) {
                        result[bJSON] = aIndex[bJSON].c
                    }
                }
            }
        }

        return result
    }

    isOffline() {
        return !this.backend.isOnline()
    }
    
    goOnline() {
        // Not sure what to do here that is similar to Twirlip9
        console.log("goOnline TODO")
    }
 
    isLoaded() {
        return this._isLoaded
    }
    
    getLatestSequence() {
        return this.latestSequence === null ? 0 : this.latestSequence
    }

    setRedrawFunction(f) {
        this.redrawFunction = f
    }

    setStreamId(streamId) {
        console.log("setStreamId", streamId)
        if (this.streamId === streamId) return
        this.streamId = streamId
        this.backend.configure(this.streamId)
    }

    // Returns promise that resolves when loaded
    async updateFromStorage() {
        return new Promise((resolve, reject) => {
            this.backend.connect({
                onLoaded: () => {
                    this._isLoaded = true
                    console.log("onLoaded")
                    resolve()
                },
                addItem: (item, isAlreadyStored) => {
                    console.log("addItem", item)
                    const sha256 = calculateSHA256(JSON.stringify(item))
                    this.addTransactionToTripleIndex(sha256, item)
                    this.setLatest(sha256, item)
                }
            })
            try {
                console.log("backend setup start")
                this.backend.setup(io)
            } catch(e) {
                alert("This app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
                reject(e)
            }
        })
    }
}
