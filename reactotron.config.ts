/**
 * Reactotron debugging setup — only loaded in __DEV__ builds.
 *
 * What it gives you:
 *  - Network tab: every fetch() call including Gemini Vision API requests
 *  - Logs tab: console.log output with source location
 *  - Timeline: custom events (call Reactotron.log() / .display() anywhere)
 *
 * Android emulator: run `adb reverse tcp:9090 tcp:9090` once per emulator session.
 * Physical device: set host to your machine's LAN IP, e.g. '192.168.1.x'.
 * Then open the Reactotron desktop app (https://github.com/infinitered/reactotron).
 */

if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Reactotron = require('reactotron-react-native').default;
  Reactotron.configure({
    name: 'Tapped In',
    host: 'localhost',
  })
    .useReactNative({
      asyncStorage: false,        // we use MMKV, not AsyncStorage
      networking: {
        // filter noisy Expo/Metro internal requests
        ignoreUrls: /\/(logs|symbolicate|message|status)$/,
      },
      editor: false,
      errors: { veto: () => false },
      overlay: false,
    })
    .connect();
}
