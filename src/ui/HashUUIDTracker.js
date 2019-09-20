// HashUUIDTracker -- ensures consistency between UUID in URL hash, application, and page title

"use strict"

import { UUID } from "./UUID.js"
import { HashUtils } from "./HashUtils.js"

export function HashUUIDTracker(uuidNameInHash = "uuid", onUUIDChangedCallback = null, updateTitleCallback = null, suggestedUUDIfNoneInHash = null) {

    let uuid

    function getUUID() {
        return uuid
    }

    function startup() {
        const hashParams = HashUtils.getHashParams()
        let newUUID = hashParams[uuidNameInHash]
        if (!newUUID) {
            newUUID = suggestedUUDIfNoneInHash || UUID.uuidv4()
            uuidChangedByApp(newUUID)
        } else {
            updateTitleForUUID()
        }
        uuid = newUUID
        window.onhashchange = () => onUUIDChangedFromHash()
    }

    function onUUIDChangedFromHash() {
        const hashParams = HashUtils.getHashParams()
        const newUUID = hashParams[uuidNameInHash]
        if (newUUID !== uuid) {
            uuid = newUUID
            updateTitleForUUID()
            if (onUUIDChangedCallback) onUUIDChangedCallback(uuid)
            m.redraw()
        }
    }

    function uuidChangedByApp(newUUID) {
        if (uuid !== newUUID) {
            uuid = newUUID
            const hashParams = HashUtils.getHashParams()
            hashParams[uuidNameInHash] = newUUID
            HashUtils.setHashParams(hashParams)
            updateTitleForUUID()
        }
    }

    function updateTitleForUUID() {
        if (updateTitleCallback) return updateTitleCallback()
        const title = document.title.split(" -- ")[0]
        document.title = title + " -- " + uuid
    }

    startup()

    return {
        getUUID,
        uuidChangedByApp
    }

}