export interface HydrationSettings {
  glassSizeMl: number;
  presets: number[];
  hotClimate: boolean;
  dailyTargetOverrideMl?: number;
  remindersEnabled: boolean;
  wakeHour: number;
  sleepHour: number;
}

export interface ElectrolyteLog {
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
}

export interface HydrationReminderEntry {
  id: string;
  hour: number;
  minute: number;
}
