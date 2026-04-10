/** @type {import('react-native-unistyles/plugin').UnistylesPluginOptions} */
const unistylesPluginOptions = {
  root: 'src',
  autoProcessImports: ['@src/shared/theme/unistyles-register'],
};

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['react-native-unistyles/plugin', unistylesPluginOptions], 'react-native-reanimated/plugin'],
  };
};
