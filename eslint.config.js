// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["**/__tests__/**/*"],
    languageOptions: {
      globals: {
        it: "readonly",
        expect: "readonly",
      },
    },
  },
]);
