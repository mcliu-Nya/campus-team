// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // server/ 是独立的 Node 后端草案（自带 tsconfig / 依赖），不参与前端 lint
    ignores: ['dist/*', 'dist-web/*', 'server/**'],
  },
]);
