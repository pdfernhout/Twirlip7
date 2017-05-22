module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "globals": {
        "define": true,
        "requirejs": true,
        "m": true,
        "twirlip7": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "double"
        ],
        "semi": [
            "error",
            "never"
        ],
        "no-console":  "off"
    }
};