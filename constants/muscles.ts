// Canonical muscle group colors and status colors — single source of truth.
// Previously duplicated across 5 workout files; import from here instead.

import type { VolumeGroup } from '@/data/exercises';

const MUSCLE_COLOR: Record<string, string> = {
  chest:       '#FF7A1A',   // safety orange
  back:        '#2B3AFF',   // cobalt
  shoulders:   '#7C5CFF',   // violet
  biceps:      '#C9940A',   // amber gold — visible on both cream and navy
  triceps:     '#C9940A',   // amber gold — visible on both cream and navy
  quads:       '#00C2A8',   // teal
  hamstrings:  '#00C2A8',   // teal
  glutes:      '#FF3DA5',   // pink
  calves:      '#00C2A8',   // teal
  core:        '#2B3AFF',   // cobalt
};

export const STATUS_COLOR: Record<string, string> = {
  lagging: '#FF3B2F',   // persimmon
  low:     '#FF7A1A',   // orange
  dialed:  '#00C2A8',   // teal
  junk:    '#7C5CFF',   // violet
};

/** Safe lookup — falls back to muted grey if the group isn't in the map. */
export function muscleColor(group: string): string {
  return MUSCLE_COLOR[group.toLowerCase()] ?? '#9BA3C0';
}

/** Returns the volume status label for a given sets-per-week count. */
function volumeStatus(setsPerWeek: number): 'lagging' | 'low' | 'dialed' | 'junk' {
  if (setsPerWeek < 10) return 'lagging';
  if (setsPerWeek < 12) return 'low';
  if (setsPerWeek <= 22) return 'dialed';
  return 'junk';
}

/** All canonical volume groups in display order. */
const VOLUME_GROUP_ORDER: VolumeGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'core',
];
