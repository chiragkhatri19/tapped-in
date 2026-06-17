import type {
  HealthAvailability, HealthPermissionStatus, HealthRange, HealthScope,
  RawSleepSession, RawStepBucket,
  RawHRVSample, RawSpO2Session, RawWeightRecord, RawExerciseSession,
} from './types';

export type HealthProviderId = 'health_connect' | 'healthkit' | 'none';

export interface HealthProvider {
  readonly id: HealthProviderId;
  isAvailable(): Promise<HealthAvailability>;
  requestPermissions(scopes: HealthScope[]): Promise<HealthPermissionStatus>;
  getGrantedPermissions(): Promise<HealthScope[]>;
  readSleep(range: HealthRange): Promise<RawSleepSession[]>;
  readSteps(range: HealthRange): Promise<RawStepBucket[]>;
  readRestingHeartRate?(range: HealthRange): Promise<number | null>;
  readHRV?(range: HealthRange): Promise<RawHRVSample[]>;
  readSpO2?(range: HealthRange): Promise<RawSpO2Session[]>;
  readWeight?(range: HealthRange): Promise<RawWeightRecord | null>;
  readExerciseSessions?(range: HealthRange): Promise<RawExerciseSession[]>;
}
