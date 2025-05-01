const { getDefaultConfig } = require('@expo/metro-config');
const os = require('os');

const defaultConfig = getDefaultConfig(__dirname);

// Tối ưu các file không cần thiết trong quá trình build
defaultConfig.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
  /.*\/__tests__\/.*/,
  /.*\.test\.js/,
  /.*\.spec\.js/,
];

// Tăng số lượng worker dựa trên số lõi CPU
defaultConfig.maxWorkers = Math.max(1, os.cpus().length - 1);

// Bỏ qua các file không cần thiết khi build
defaultConfig.transformer.getTransformOptions = async () => ({
  transform: {
    inlineRequires: true,
  },
});

module.exports = defaultConfig;