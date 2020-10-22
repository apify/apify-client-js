const BrotliPlugin = require('brotli-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    target: 'web',
    module: {
        rules: [
            {
                test: /\.(js)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
    resolve: {
        extensions: ['*', '.js'],
    },
    node: {
        fs: 'empty',
        os: false,
        stream: false,
        util: false,
        zlib: false,
        Buffer: false,
        global: false,
        process: 'mock',
    },
    output: {
        path: `${__dirname}/dist`,
        filename: 'bundle.js',
        libraryTarget: 'umd',
        library: 'ApifyClient',
    },
    mode: 'development',
    // plugins: [
    //     new BrotliPlugin({
    //         asset: '[path].br[query]',
    //         test: /\.(js)$/,
    //         threshold: 10240,
    //         minRatio: 0.8,
    //     }),
    // ],
};
