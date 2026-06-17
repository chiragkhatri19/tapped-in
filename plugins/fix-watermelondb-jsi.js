/**
 * Config plugin that removes the stale JSIModulePackage + WatermelonDBJSIPackage
 * imports (and any getJSIModulePackage override) injected by
 * @morrowdigital/watermelondb-expo-plugin.
 *
 * `com.facebook.react.bridge.JSIModulePackage` was removed in RN 0.73+ and no
 * longer exists in RN 0.81 (New Architecture). The plugin injects the imports
 * via the typed `withMainApplication` mod, so this cleanup MUST also use
 * `withMainApplication` (not `withDangerousMod`) and be listed AFTER the
 * watermelondb plugin in app.json — typed mods run after dangerous mods, and a
 * later-registered withMainApplication action runs on the already-injected
 * contents. (A dangerousMod here runs BEFORE the injection and is a no-op.)
 *
 * On the New Architecture WatermelonDB's JSI bindings are installed
 * automatically, so the override is not needed.
 */
const { withMainApplication } = require('@expo/config-plugins');

module.exports = function fixWatermelonDBJsi(config) {
  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;

    contents = contents
      // stale imports
      .replace(/^[ \t]*import com\.nozbe\.watermelondb\.jsi\.WatermelonDBJSIPackage;?[ \t]*\r?\n/m, '')
      .replace(/^[ \t]*import com\.facebook\.react\.bridge\.JSIModulePackage;?[ \t]*\r?\n/m, '')
      // any getJSIModulePackage override the plugin may inject (Kotlin or Java)
      .replace(
        /\n[ \t]*(override fun|protected) [^\n]*getJSIModulePackage[\s\S]*?WatermelonDBJSIPackage\(\);?[ \t]*\r?\n[ \t]*\}[ \t]*\r?\n/m,
        '\n',
      );

    cfg.modResults.contents = contents;
    return cfg;
  });
};
