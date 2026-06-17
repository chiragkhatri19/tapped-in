import { SleepEntry } from '@/data/sleep-types';

export function hasStages(entry: SleepEntry): boolean {
  return (
    entry.deepMin !== undefined &&
    entry.remMin !== undefined &&
    entry.lightMin !== undefined
  );
}

export function stageTotalMin(entry: SleepEntry): number {
  return (entry.deepMin ?? 0) + (entry.remMin ?? 0) + (entry.lightMin ?? 0) + (entry.awakeMin ?? 0);
}

export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Handles the overnight case: if wake <= bedtime, add 24h to wake
export function computeDurationMin(bedtimeISO: string, wakeISO: string): number {
  const bed = new Date(bedtimeISO).getTime();
  let wake = new Date(wakeISO).getTime();
  if (wake <= bed) {
    wake += 24 * 60 * 60 * 1000;
  }
  return Math.round((wake - bed) / (60 * 1000));
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatClock(iso: string): string {
  const date = new Date(iso);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const mm = String(minutes).padStart(2, '0');
  return `${hours}:${mm} ${ampm}`;
}

export function recentEntries(
  entries: Record<string, SleepEntry>,
  days: number,
): (SleepEntry | null)[] {
  const result: (SleepEntry | null)[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    result.push(entries[key] ?? null);
  }
  return result;
}

export function averageDurationMin(entries: (SleepEntry | null)[]): number {
  const valid = entries.filter((e): e is SleepEntry => e !== null);
  if (valid.length === 0) return 0;
  const total = valid.reduce((sum, e) => sum + e.durationMin, 0);
  return Math.round(total / valid.length);
}

export function sleepDebtMin(
  entries: (SleepEntry | null)[],
  days: number,
  targetMin: number,
): number {
  const window = entries.slice(-days);
  return window.reduce((debt, e) => {
    const duration = e ? e.durationMin : 0;
    const shortfall = targetMin - duration;
    return debt + (shortfall > 0 ? shortfall : 0);
  }, 0);
}

export function bedtimeConsistency(entries: (SleepEntry | null)[]): {
  variminutes: number;
  label: string;
} {
  const valid = entries.filter((e): e is SleepEntry => e !== null);
  if (valid.length < 2) return { variminutes: 0, label: 'not enough data' };

  const minutesFromMidnight = valid.map((e) => {
    const bed = new Date(e.bedtime);
    let mins = bed.getHours() * 60 + bed.getMinutes();
    if (mins > 16 * 60) mins -= 24 * 60;
    return mins;
  });

  const mean = minutesFromMidnight.reduce((a, b) => a + b, 0) / minutesFromMidnight.length;
  const variance =
    minutesFromMidnight.reduce((sum, m) => sum + Math.pow(m - mean, 2), 0) /
    minutesFromMidnight.length;
  const stddev = Math.round(Math.sqrt(variance));

  let label: string;
  if (stddev < 20) label = 'rock solid';
  else if (stddev < 40) label = 'tight';
  else if (stddev < 70) label = 'ok';
  else label = 'all over the place';

  return { variminutes: stddev, label };
}
