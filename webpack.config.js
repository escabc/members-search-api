// webpack.config.js
const path = require('path');
const slsw = require('serverless-webpack');
var nodeExternals = require('webpack-node-externals')
const ServerlessCopyWebpackPlugin = require('serverless-copy-webpack-plugin');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: 'production',
  // Generate sourcemaps for proper error messages
  devtool: 'eval',
  // Since 'aws-sdk' is not compatible with webpack,
  // we exclude all node dependencies
  externals: [nodeExternals()],
  // Run babel on all .js files and skip those in node_modules
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new ServerlessCopyWebpackPlugin()
  ],
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
  }
}