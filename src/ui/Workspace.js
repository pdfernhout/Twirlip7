define(["vendor/sha256", "vendor/mithril"], function(sha256, mDiscard) {
    "use strict"

    // This elegant style of defining a Workspace is "inefficient" of memory
    // compared to sharing function definitions via a common prototype.
    // But, we are usually only going to have one Workspace in the application,
    // so the clarity has no significant cost here.
    
    function Workspace() {
        const notebooks = {}
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
})