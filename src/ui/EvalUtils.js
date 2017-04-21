define([], function() {
    "use strict"

    const Evaler = {
        
        evalOrError(text) {
            let result
            try {
                result = eval(text)
            } catch (error) {
                result = error                
            }
            return result
        },

        eval(text) {
            return eval(text)
        }
    }

    return Evaler
})
