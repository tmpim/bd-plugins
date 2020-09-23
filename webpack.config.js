const webpack = require("webpack");
const glob = require("glob");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

const toCamel = (s) => {
    return s.replace(/((?:[-_]|^)[a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    });
};


module.exports = {
    target: "electron-preload",

    externals: {
        electron: `electron`,
    },

    entry: glob.sync("./src/**/*.plugin.ts*").reduce((acc, path) => {
        const entry = path.match(/.+\/(.+?).plugin/)[1];
        acc[entry] = path
        return acc
    }, {}),

    output: {
        filename: "[name].plugin.js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "commonjs2",
        libraryExport: "default"
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.scss$/i,
                use: ['raw-loader', 'sass-loader'],
            }
        ],
    },

    resolve: {
        alias: {
            ["@shared"]: path.resolve(__dirname, "src/shared/")
        },
        extensions: [".tsx", ".ts", ".js"],
    },

    plugins: [
        new webpack.BannerPlugin({
            raw: true,
            banner: function (data) {
                const name = toCamel(data.chunk.name);
                return `//META{"name":"${name}","authorId":"333530784495304705"}*//`;
            }
        })
    ],

    mode: "production",
    devtool: false,
    optimization: {
        usedExports: true,
        innerGraph: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    output: {
                        comments: /^META/
                    }
                }
            })
        ]
    }
};
