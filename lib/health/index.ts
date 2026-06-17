import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { HealthProvider } from './provider';
import { NoopProvider } from './noop-provider';

let _provider: HealthProvider | null = null;

export function getHealthProvider(): HealthProvider {
  if (_provider) return _provider;

  // Expo Go — no native modules available
  if (Constants.appOwnership === 'expo') {
    _provider = new NoopProvider('expo_go');
    return _provider;
  }

  if (Platform.OS === 'android') {
    try {
      // Dynamic require so the module is optional (graceful degradation in Expo Go)
      require('react-native-health-connect');
      const { HealthConnectProvider } = require('./health-connect-provider') as typeof import('./health-connect-provider');
      _provider = new HealthConnectProvider();
    } catch {
      _provider = new NoopProvider('no_module');
    }
    return _provider;
  }

  if (Platform.OS === 'ios') {
    const { HealthKitProvider } = require('./healthkit-provider') as typeof import('./healthkit-provider');
    _provider = new HealthKitProvider();
    return _provider;
  }

  _provider = new NoopProvider('unsupported_os');
  return _provider;
}
