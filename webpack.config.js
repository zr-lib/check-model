const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  mode: 'production',
  entry: './src/index.ts',
  experiments: {
    outputModule: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'checkModel.js',
    library: {
      name: 'checkModel',
      type: 'module' //'umd'
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
};
