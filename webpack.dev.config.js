const webpack = require('webpack')
const path = require('path')
const project = require('./project.config.js')
const SRC_DIR = path.join(project.basePath, project.srcDir)

const config = {
    entry: {
        main: []
    },
    module: {
        rules: []
    },
    plugins: []
}
config.entry.main.push(
    'webpack-hot-middleware/client?path=./__webpack_hmr'
)
config.module.rules.push({
    test: /(\.jsx|\.js)$/,
    use: {
        loader: 'babel-loader?cacheDirectory'
    },
    include: SRC_DIR,
    exclude: /node_modules/
})

config.module.rules.push({
    test: /(\.less|\.css)$/,
    use: [{
        loader: "style-loader"
    }, {
        loader: "css-loader"
    }, {
        loader: 'postcss-loader',
        options: {
            ident: 'postcss',
        },
    }, {
        loader: "less-loader",
        options: {
            javascriptEnabled: true
        }
    }]
})
config.plugins.push(
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
)
module.exports = config