module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-modules-commonjs'
    ],
    env: {
      production: {
        plugins: [],
      },
    },
    sourceMaps: true,
    ignore: [],
    overrides: [
      {
        test: /node_modules\/.*\.(ts|tsx)$/,
        presets: ['@babel/preset-typescript'],
      },
    ],
  };
};
