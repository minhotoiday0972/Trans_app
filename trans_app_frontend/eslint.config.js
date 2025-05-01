// eslint.config.js
const eslint = require('@eslint/js');
const react = require('eslint-plugin-react');
const reactNative = require('eslint-plugin-react-native');

module.exports = [
  eslint.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        AbortController: 'readonly',
        FormData: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
      },
    },
    plugins: {
      react,
      'react-native': reactNative,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactNative.configs.all.rules,
      'no-restricted-exports': ['error', { restrictDefaultExports: { direct: true } }],
      'react/prop-types': 'off',
      'react-native/no-unused-styles': 'error',
      'react-native/no-inline-styles': 'warn',
      'no-undef': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // Cấu hình riêng cho các file Node.js
  {
    files: ['babel.config.js', 'metro.config.cjs', 'update-env-*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  // Cấu hình riêng cho eslint.config.js
  {
    files: ['eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'writable',
      },
    },
  },
];