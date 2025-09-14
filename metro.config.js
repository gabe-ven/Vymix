const { withNativeWind } = require('nativewind/metro');
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

config.resolver.assetExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: './app/globals.css' });