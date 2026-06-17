import type {
  HealthAvailability, HealthPermissionStatus, HealthRange, HealthScope,
  RawSleepSession, RawStepBucket,
  RawHRVSample, RawSpO2Session, RawWeightRecord, RawExerciseSession,
} from './types';
import type { HealthProvider } from './provider';

export class NoopProvider implements HealthProvider {
  readonly id = 'none' as const;

  private reason: HealthAvailability['reason'];

  constructor(reason: HealthAvailability['reason'] = 'no_module') {
    this.reason = reason;
  }

  async isAvailable(): Promise<HealthAvailability> { return { available: false, reason: this.reason }; }
  async requestPermissions(_scopes: HealthScope[]): Promise<HealthPermissionStatus> { return { granted: [], denied: _scopes }; }
  async getGrantedPermissions(): Promise<HealthScope[]> { return []; }
  async readSleep(_range: HealthRange): Promise<RawSleepSession[]> { return []; }
  async readSteps(_range: HealthRange): Promise<RawStepBucket[]> { return []; }
  async readRestingHeartRate(_range: HealthRange): Promise<number | null> { return null; }
  async readHRV(_range: HealthRange): Promise<RawHRVSample[]> { return []; }
  async readSpO2(_range: HealthRange): Promise<RawSpO2Session[]> { return []; }
  async readWeight(_range: HealthRange): Promise<RawWeightRecord | null> { return null; }
  async readExerciseSessions(_range: HealthRange): Promise<RawExerciseSession[]> { return []; }
}
