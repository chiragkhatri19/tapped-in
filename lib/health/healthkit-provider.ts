import type { HealthAvailability, HealthPermissionStatus, HealthRange, HealthScope, RawSleepSession, RawStepBucket } from './types';
import type { HealthProvider } from './provider';

// iOS HealthKit — stub until iOS launch phase
export class HealthKitProvider implements HealthProvider {
  readonly id = 'healthkit' as const;

  async isAvailable(): Promise<HealthAvailability> {
    return { available: false, reason: 'unsupported_os' };
  }

  async requestPermissions(scopes: HealthScope[]): Promise<HealthPermissionStatus> {
    return { granted: [], denied: scopes };
  }

  async getGrantedPermissions(): Promise<HealthScope[]> {
    return [];
  }

  async readSleep(_range: HealthRange): Promise<RawSleepSession[]> {
    return [];
  }

  async readSteps(_range: HealthRange): Promise<RawStepBucket[]> {
    return [];
  }
}
