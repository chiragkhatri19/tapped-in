// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('db');

// ── Emulator workaround ───────────────────────────────────────────────────────
// The unminified dev bundle is ~16.5MB and truncates mid-transfer on the
// Medium_Phone AVD (Hermes then fails with "Compiling JS failed"). Forcing
// bundle requests to be minified + production-mode drops it to ~5-6MB, which the
// dev server delivers completely. Trade-off: no Fast Refresh (reload manually).
// Remove this block to restore the normal dev experience.
//
// IMPORTANT: getDefaultConfig already sets server.rewriteRequestUrl to handle
// .expo/.virtual-metro-entry → real entry point rewrites for Expo Router.
// We must chain our rewrite AFTER Expo's, not replace it.
const expoRewrite = config.server?.rewriteRequestUrl ?? ((url) => url);
config.server = config.server || {};
config.server.rewriteRequestUrl = (url) => {
  // Step 1: let Expo Router resolve .expo/.virtual-metro-entry → /index.bundle
  url = expoRewrite(url);
  // Step 2: force minified production-mode for all remaining .bundle requests
  if (!url.includes('.bundle')) return url;
  let u = url
    .replace(/([?&])dev=true/, '$1dev=false')
    .replace(/([?&])minify=false/, '$1minify=true')
    // Remove sourcePaths=url-server: it triggers a multipart HTTP response that
    // OkHttp fails to parse over the ADB reverse tunnel (chunked encoding error).
    .replace(/([?&])sourcePaths=[^&]*/g, '');
  if (!/[?&]dev=/.test(u)) u += (u.includes('?') ? '&' : '?') + 'dev=false';
  if (!/[?&]minify=/.test(u)) u += (u.includes('?') ? '&' : '?') + 'minify=true';
  return u;
};

module.exports = config;
