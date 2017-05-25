define([], function() {
    "use strict"

    const EvalUtils = {

        evalOrError(text) {
            let result
            try {
                // object defintions produce syntax error unless within parens
                if (text.match(/^\s*{/)) text = "(" + text + ")"
                result = EvalUtils.eval(text)
            } catch (error) {
                result = error
            }
            return result
        },

        eval(text) {
            return eval(text)
        }
    }

    return EvalUtils
})
