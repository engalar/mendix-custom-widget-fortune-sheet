const base = require("@mendix/pluggable-widgets-tools/configs/eslint.ts.base.json");

module.exports = {
    ...base,
    rules: {
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/ban-ts-ignore": "warn",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/no-empty-function": "off",
        "@typescript-eslint/no-this-alias": "off",
        "react/no-find-dom-node": "off",
        "react/no-deprecated": "warn",
        "no-undef": "warn",
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "react/display-name": "off"
    }
};
