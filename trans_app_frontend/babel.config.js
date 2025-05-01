module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-modules-commonjs',
      ['@babel/plugin-proposal-export-namespace-from']
    ],
    sourceMaps: true,
    ignore: [
      "node_modules/lodash/**/*",
      "node_modules/core-js/**/*"
    ],
    compact: true,
  };
};