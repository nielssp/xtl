var ExtractTextPlugin = require("extract-text-webpack-plugin");
module.exports = {
    context: __dirname + "/src/js",
    entry: "./main",
    output: {
        path: __dirname + "/dist",
        filename: "js/bundle.js"
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader") },
            { test: /\.scss$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader") },
            { test: /\.jpe?g$|\.gif$|\.png$|\.svg$|\.woff$|\.ttf$/, loader: "file" },
            { test: /\.html?$/, loader: "file?name=[name].[ext]" }
        ]
    },
    plugins: [
        new ExtractTextPlugin("css/bundle.css", {
            allChunks: true
        })
    ]
};
