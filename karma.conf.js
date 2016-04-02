var webpackConfig = require('./webpack.config.js');
webpackConfig.entry = {};

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['mocha', 'chai'],
        files: [
            'test/*.spec.js'
        ],
        preprocessors: {
            'test/*.spec.js': ['webpack']
        },
        webpack: webpackConfig,
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true
    });
};
