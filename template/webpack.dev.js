const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const baseConfig = require('./webpack.base')

module.exports = merge(baseConfig, {
  devtool: 'source-map',
  devServer: {
    open: true,
    contentBase: './dist',
    port: 7979,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
    }),
    new HtmlWebpackPlugin({
      template: './src/template.html',
    }),
  ],
})
