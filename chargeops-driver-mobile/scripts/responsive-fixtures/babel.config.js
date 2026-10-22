const path = require('path');
module.exports = function (api) {
  api.cache(true);
  return { presets: [require.resolve('babel-preset-expo')], plugins: [[require.resolve('babel-plugin-module-resolver'), { alias: { '@': path.resolve(__dirname, '../../src') } }]] };
};
