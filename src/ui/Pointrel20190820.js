/* global sha256 */

import { StoreUsingServer } from "./StoreUsingServer.js"
import { UUID } from "./UUID.js"

// defines sha256
import "./vendor/sha256.js"
const calculateSHA256 = sha256

import { CanonicalJSON } from "./CanonicalJSON.js"

let userID = localStorage.getItem("userID") || "anonymous"

function makeKey(jsonObject) {
    return CanonicalJSON.stringify(jsonObject)
}

export class Pointrel20190820 {
    
    constructor() {
        this.clearData()

        this.backend = StoreUsingServer(m.redraw, this.streamId, userID)

        this.redrawFunction = null

        // The "application" name is a debugging hint about what app made the transaction and why
        // use "app/method" for more details
        this.defaultApplicationName = "test"
    }

    clearData() {
        this.tripleIndex = {}
        this.indexedTransactions = {}
        this.latestSHA256 = null
        this.latestSequence = null
        this.streamId = null
        this._isLoaded = false
        this.currentTransaction = null
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
    
    // alternateStreamId is optional
    sendCurrentTransaction(alternateStreamId) {
        // TODO -- Faking it for now, copying a little code from processNextSend
        const transaction = this.currentTransaction
        const latest = this.getLatestSHA256()
        // TODO: Issue when using alternateStreamId -- what should the sequence be?
        // const latestTransaction = latest ? await getTransactionFromCache(latest) : null
        const latestTransaction = latest ? this.indexedTransactions[latest] : null
        const sequence = latestTransaction ? latestTransaction.sequence + 1 : 0 
        transaction.previous = latest
        transaction.sequence = sequence    
        const sha256 = calculateSHA256(CanonicalJSON.stringify(this.currentTransaction))
        this.addTransactionToTripleIndex(sha256, this.currentTransaction)

        // TODO: sendQueue.push(currentTransaction)
        setTimeout(() => this.backend.addItem(transaction, alternateStreamId), 10)
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
            // console.log("transaction already indexed", sha256, transaction)
            return
        }
        if (transaction.type === "triples") {
            const triples = transaction.triples
            // Most recent triples are at end
            for (let i = 0; i < triples.length; i++) {
                const triple = triples[i]

                const aKey = makeKey(triple.a)
                let aIndex = this.tripleIndex[aKey]
                if (!aIndex) {
                    aIndex = {}
                    this.tripleIndex[aKey] = aIndex
                }

                const bKey = makeKey(triple.b)
                let bIndex = aIndex[bKey]
                if (!bIndex || bIndex.sequence < transaction.sequence) {
                    bIndex = {c: triple.c, sequence: transaction.sequence}
                    aIndex[bKey] = bIndex
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
        return UUID.uuidv4()
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
        const aKey = makeKey(a)
        const aIndex = this.tripleIndex[aKey]
        if (aIndex) {
            const bKey = makeKey(b)
            const bIndex = aIndex[bKey]
            if (bIndex) return bIndex.c
        }
    
        return undefined
    }
    
    addTriple(a, b, c) {
        // console.log("addTriple", a, b, c)
    
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

        const aKey = makeKey(a)

        /*
        // first check any pending transactions -- most recent are at end
        for (let queueIndex = sendQueue.length - 1; queueIndex >= 0; queueIndex--) {
            const transaction = sendQueue[queueIndex]
            if (transaction.type === "triples") {
                const triples = transaction.triples
                // Most recent triples are at end
                for (let i = triples.length - 1; i >= 0; i--) {
                    const triple = triples[i]
                    const bKey = JSON.stringify(triple.b)
                    if (makeKey(triple.a) === aKey && result[bKey] === undefined) {
                        if (!setId || triple.b[setId]) {
                            result[bKey] = triple.c
                        }
                    }
                }
            }
        }
        */

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
        return this.latestSequence
    }

    setRedrawFunction(f) {
        this.redrawFunction = f
    }

    setStreamId(streamId, keepData) {
        console.log("setStreamId", streamId)
        if (this.streamId === streamId) return
        if (!keepData) this.clearData()
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
                onAddItem: (item) => {
                    // console.log("onAddItem", item)
                    const sha256 = calculateSHA256(CanonicalJSON.stringify(item))
                    this.addTransactionToTripleIndex(sha256, item)
                    this.setLatest(sha256, item)
                }
            })
            try {
                console.log("backend setup start")
                this.backend.setup()
            } catch(e) {
                alert("This app requires a backend server supporting socket.io (i.e. won't work correctly on rawgit)")
                reject(e)
            }
        })
    }

    openStream(streamId) {
        console.log("openStream", streamId)
        this.backend.openStream(streamId)
    }
}
