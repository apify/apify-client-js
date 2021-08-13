const { ProvidePlugin, DefinePlugin } = require('webpack');

const Package = require('./package.json');

/** @type {import('webpack').Configuration} */
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
        mainFields: ['browser', 'main', 'module'],
        extensions: ['*', '.js'],
        fallback: {
            fs: false,
            os: false,
            stream: false,
            util: false,
            zlib: false,
        },
    },
    node: {
        global: false,
    },
    output: {
        path: `${__dirname}/dist`,
        filename: 'bundle.js',
        libraryTarget: 'umd',
        library: 'ApifyClient',
    },
    mode: 'development',
    plugins: [
        new ProvidePlugin({
            process: require.resolve('process/browser'),
        }),
        new DefinePlugin({
            VERSION: JSON.stringify(Package.version),
            BROWSER_BUILD: true,
        }),
    ],
};
