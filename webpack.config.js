const webpack = require('webpack')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CopyWebpackPlugin = require('copy-webpack-plugin')
const project = require('./project.config.js')

const HappyPack = require('happypack') // 多线程构建；优化构建速度
const os = require('os')
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length  });

const UglifyJsPlugin = require('uglifyjs-webpack-plugin') // 优化代码压缩

const envDevelopment = project.env === 'development'
const envProduction = project.env === 'production'
const devtool = project.sourceMap ? 'cheap-source-map' : false

const SRC_DIR = path.join(project.basePath, project.srcDir)

const config = {
    entry: {
        main: [SRC_DIR]
    },
    output: {
        path: path.resolve(project.basePath, project.outDir),
        filename: envDevelopment ? 'js/[name].js' : "js/[name].[chunkhash:5].js",
        publicPath: project.publicPath
    },
    mode: project.env,
    devtool: devtool,
    resolve: {
        modules: [
            project.srcDir,
            'node_modules',
        ],
        alias: {
            '@': SRC_DIR
        },
        extensions: ['*', '.js', '.jsx', '.json', '.less', '.css']
    },
    module: {
        rules: [
            {
                test: /(\.jsx|\.js)$/,
                // 使用happypack
                use: 'happypack/loader?id=js',
                include: SRC_DIR,
                exclude: /node_modules/
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    outputPath: "images"
                }
            }
        ]
    },
    optimization: {
        sideEffects: false,
        splitChunks: {
            chunks: 'all',
            minSize: 30000,
            minChunks: 1,
            cacheGroups: {
                common: {
                    name: 'common',
                    test: /node_modules/,
                    chunks: 'initial',
                    priority: -10,
                    enforce: true
                },
                styles: {
                    name: 'styles',
                    test: /(\.less|\.css)$/,
                    chunks: 'all',
                    enforce: true,
                }
            }
        }
    },
    performance: {
        hints: false
    },
    plugins: [
        new webpack.DllReferencePlugin({
            context: project.basePath,
            manifest: path.resolve(project.basePath, 'dll', 'manifest.json')
        }),
        new HtmlWebpackPlugin({
            template: 'index.html',
            inject: true,
            favicon: path.resolve('favicon.ico'),
            minify: {
                collapseWhitespace: true,
            }
        }),
    ]
}

const fontLoader = [['woff', 'application/font-woff'], ['woff2', 'application/font-woff2'], ['otf', 'font/opentype'], ['ttf', 'application/octet-stream'], ['eot', 'application/vnd.ms-fontobject'], ['svg', 'image/svg+xml']]
fontLoader.forEach((font) => {
    let extension = font[0]
    let mimetype = font[1]
    config.module.rules.push({
        test: new RegExp(`\\.${extension}$`),
        loader: 'url-loader',
        options: {
            name: 'fonts/[name].[ext]',
            limit: 10000,
            mimetype,
        },
    })
})

if (envDevelopment) {
    config.module.rules.push({
        test: /(\.less|\.css)$/,
        use: [{
            loader: "style-loader"
        }, {
            loader: "css-loader"
        }, {
            loader: "less-loader",
            options: {
                javascriptEnabled: true
            }
        }]
    })
    config.entry.main.push(
        'webpack-hot-middleware/client?path=./__webpack_hmr'
    )
    config.plugins.push(
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new HappyPack({
            id: 'js',
            loaders: [
                'babel-loader?cacheDirectory=true',
            ]
        }),
    )
}

if (envProduction) {
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
}

module.exports = config