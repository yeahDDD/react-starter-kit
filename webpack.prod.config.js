const path = require('path')
const project = require('./project.config.js')
const SRC_DIR = path.join(project.basePath, project.srcDir)

const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HappyPack = require('happypack') // 多线程构建；优化构建速度
const os = require('os')
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length  });
const UglifyJsPlugin = require('uglifyjs-webpack-plugin') // 优化代码压缩

const config = {
    module: {
        rules: []
    },
    plugins: []
}
config.module.rules.push({
    test: /(\.jsx|\.js)$/,
    // 使用happypack
    use: 'happypack/loader?id=js',
    include: SRC_DIR,
    exclude: /node_modules/
})
config.module.rules.push({
    test: /(\.less|\.css)$/,
    use: [
        MiniCssExtractPlugin.loader,
        {
            loader: 'css-loader',
            options: {
                importLoaders: 1,
                minimize: {
                    autoprefixer: {
                        add: true,
                        remove: true,
                        browsers: ['last 10 versions'],
                    },
                    discardComments: {
                        removeAll: true,
                    },
                    discardUnused: false,
                    mergeIdents: false,
                    reduceIdents: false,
                    safe: true
                }
            }
        },
        {
            loader: 'less-loader',
            options: {
                javascriptEnabled: true
            }
        }
    ]
})
config.plugins.push(
    new MiniCssExtractPlugin({
        filename: "css/main.[chunkhash:5].css",
        chunkFilename: 'css/main.[contenthash:5].css'
    }),
    new CopyWebpackPlugin([{
        from: path.join(project.basePath, 'dll'),
        to: path.join(project.basePath, 'dist', 'dll')
    }]),
    new HappyPack({
        id: 'js',
        loaders: [
            'babel-loader?cacheDirectory=true',
        ],
        threadPool: happyThreadPool,
        verbose: true
    }),
    new UglifyJsPlugin({
        cache: true,
        parallel: true,
        exclude: /node_modules/,
        sourceMap: project.sourceMap ? true : false,
        uglifyOptions: {
            warnings: false,
            output: {
              comments: false,
              beautify: false,
            },
            ie8: true,
          }
    }),
)
module.exports = config