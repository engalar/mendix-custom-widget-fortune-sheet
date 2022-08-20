const baseConfig = require("@mendix/pluggable-widgets-tools/configs/webpack.config.dev");//Can also be webpack.config.dev.js

// We're doing dirty hacking, because our camel case stuff doesn't transpile nicely to ES5. Need another solution, but this works in IE11
baseConfig[0].externals = [
    /^mendix\//,
    /^dojo\//,
    "react",
    "big.js"
];

module.exports = baseConfig
