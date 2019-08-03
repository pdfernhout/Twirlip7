export function Workspace() {
    const notebooks = []
    const currentNotebook = null

    function getNotebooks() {
        return notebooks
    }

    function getCurrentNotebook() {
        return currentNotebook
    }

    return {
        getNotebooks,
        getCurrentNotebook
    }
}
