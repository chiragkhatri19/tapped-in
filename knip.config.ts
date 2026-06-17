import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    // Expo Router — every file in app/ is an entry point (file-based routing)
    'app/**/*.{ts,tsx}',
    // Calculation engine public API
    'src/index.ts',
    // Dev scripts
    'scripts/*.{js,mjs}',
  ],
  project: [
    '{app,components,src,lib,data,stores,context,hooks,types,constants}/**/*.{ts,tsx}',
  ],
  ignore: [
    // Test scenarios used manually, not imported anywhere
    'src/testScenarios.ts',
  ],
  ignoreDependencies: [
    // Expo auto-linking / CLI tools — used via npx, not static imports
    '@expo/cli',
    '@expo/ngrok',
    'expo-status-bar',
    // Babel / Metro — referenced by string in babel.config.js
    'babel-plugin-react-compiler',
    'babel-preset-expo',
    // Required at runtime by eslint-plugin-react-hooks v7 (zod-based config validation)
    'zod',
    'zod-validation-error',
    // Loaded via __DEV__ require() — not a static import knip can trace
    'reactotron-react-native',
    // Polyfills wired in lib/nitro-polyfill (not standard imports)
    '@stardazed/streams-text-encoding',
    '@ungap/structured-clone',
    // Per CLAUDE.md: replace all FlatList → FlashList. Not fully wired yet but required.
    '@shopify/flash-list',
    // Expo OTA updates — referenced in app.json, not a JS import
    'expo-updates',
  ],
  ignoreExportsUsedInFile: true,
};

export default config;
