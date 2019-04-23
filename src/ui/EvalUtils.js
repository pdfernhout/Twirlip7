"use strict"

export const EvalUtils = {

    triedRequire: false,

    evalOrError(text) {
        let result
        try {
            // object definitions produce syntax error unless within parens
            if (text.match(/^\s*{/)) text = "(" + text + ")"
            result = EvalUtils.eval(text)
        } catch (error) {
            result = error
        }
        return result
    },

    eval(text) {
        if (!EvalUtils.triedRequire) {
            // hides an error the first time try using requirejs
            EvalUtils.triedRequire = true
            try {
                eval("requirejs([], function() {})")
            } catch (error) {
                // console.log("triedRequire error", error)
            }
        }
        return eval(text)
    }
}
