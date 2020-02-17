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
    output: {
        path: `${__dirname}/dist`,
        filename: 'bundle.js',
        libraryTarget: 'umd',
        libraryExport: 'default',
        library: 'ApifyClient',
    },
    mode: 'production',
    plugins: [
        new BrotliPlugin({
            asset: '[path].br[query]',
            test: /\.(js)$/,
            threshold: 10240,
            minRatio: 0.8,
        }),
    ],
};
