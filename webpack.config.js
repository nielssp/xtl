module.exports = {
    context: __dirname + "/src/js",
    entry: "./entry",
    output: {
        path: __dirname + "/dist",
        filename: "js/bundle.js"
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
            { test: /\.scss$/, loader: "style!css!sass" },
            { test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$/, loader: "file" }
        ]
    }
};
