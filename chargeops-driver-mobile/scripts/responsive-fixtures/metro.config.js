const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const app = path.resolve(__dirname, '../..');
config.watchFolders = [app];
config.resolver.nodeModulesPaths = [path.join(app, 'node_modules')];
config.resolver.resolveRequest = (context, name, platform) => {
  if (/\/src\/screens\/(PaymentProcessingScreen|QRCheckInScreen)\.tsx$/.test(context.originModulePath.replaceAll('\\', '/')) && /bookingService/.test(name)) {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'bookingService.fixture.js') };
  }
  if (context.originModulePath.replaceAll('\\', '/').endsWith('/src/screens/QRCheckInScreen.tsx') && name === 'expo-camera') return { type: 'sourceFile', filePath: path.join(__dirname, 'camera.fixture.jsx') };
  return context.resolveRequest(context, name, platform);
};
module.exports = config;
