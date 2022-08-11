const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    output: {
        path: path.join(__dirname, '..', 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader' }
        ]
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: './src/index.html', to: 'index.html' }
            ]
        })
    ]
}
