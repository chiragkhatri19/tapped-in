/**
 * Config plugin that wires react-native-health-connect's permission launcher
 * into MainActivity.onCreate.
 *
 * The library exposes `HealthConnectPermissionDelegate.setPermissionDelegate(activity)`
 * which calls `registerForActivityResult(...)`. That MUST run during onCreate
 * (before the activity reaches STARTED). If it never runs, `requestPermission()`
 * hits an uninitialized `lateinit var` and throws an UNCATCHABLE
 * `UninitializedPropertyAccessException` inside a coroutine — crashing the whole
 * app the moment the user taps "connect" on the tracker sheet.
 *
 * The library's own Expo plugin (react-native-health-connect/app.plugin.js) only
 * adds the legacy `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE` intent-filter
 * (Android 13 and below). It does NOT (a) wire the permission delegate, nor (b) add
 * the Android 14+ (API 34+) privacy-policy entry point. On Android 14/15 — where
 * Health Connect lives in the OS — an app is invisible in the Health Connect app
 * list unless it declares the VIEW_PERMISSION_USAGE / HEALTH_PERMISSIONS activity.
 * This plugin fills both gaps so the fixes survive `expo prebuild --clean`.
 *
 * Must be listed AFTER "react-native-health-connect" in app.json.
 */
const { withMainActivity, withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const IMPORT = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const CALL = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';

// Adds the Android 14+ privacy-policy activity-alias that makes the app appear in
// Health Connect and lets requestPermission() register it.
function withHealthConnectManifest(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app['activity-alias'] = app['activity-alias'] || [];

    const exists = app['activity-alias'].some(
      (a) => a.$ && a.$['android:name'] === 'ViewPermissionUsageActivity',
    );
    if (!exists) {
      app['activity-alias'].push({
        $: {
          'android:name': 'ViewPermissionUsageActivity',
          'android:exported': 'true',
          'android:targetActivity': '.MainActivity',
          'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' } }],
            category: [{ $: { 'android:name': 'android.intent.category.HEALTH_PERMISSIONS' } }],
          },
        ],
      });
    }
    return cfg;
  });
}

module.exports = function withHealthConnectDelegate(config) {
  config = withHealthConnectManifest(config);
  return withMainActivity(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') {
      throw new Error(
        'with-health-connect-delegate: expected a Kotlin MainActivity (.kt). Got ' +
          cfg.modResults.language,
      );
    }

    let contents = cfg.modResults.contents;

    // Add the import once.
    if (!contents.includes(IMPORT)) {
      contents = contents.replace(
        /(^package .*\n)/m,
        `$1\n${IMPORT}\n`,
      );
    }

    // Insert the delegate registration right after `super.onCreate(...)` inside
    // onCreate — but only once.
    if (!contents.includes(CALL)) {
      contents = contents.replace(
        /(super\.onCreate\([^)]*\)\s*\n)/,
        `$1\n    // Health Connect permission launcher (see plugins/with-health-connect-delegate.js)\n    ${CALL}\n`,
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};
