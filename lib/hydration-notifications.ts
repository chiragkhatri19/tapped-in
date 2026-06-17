import * as Notifications from 'expo-notifications';
import type { HydrationSettings, HydrationReminderEntry } from '@/data/hydration-types';

const REMINDER_COUNT = 6;

function buildReminderTimes(wakeHour: number, sleepHour: number): Array<{ hour: number; minute: number }> {
  const span = sleepHour - wakeHour;
  if (span <= 0) return [];
  const times: Array<{ hour: number; minute: number }> = [];
  for (let i = 0; i < REMINDER_COUNT; i++) {
    const offsetH = Math.round((span * i) / REMINDER_COUNT);
    times.push({ hour: wakeHour + offsetH, minute: 0 });
  }
  return times;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWaterReminders(
  settings: HydrationSettings
): Promise<HydrationReminderEntry[]> {
  await cancelWaterReminders([]);

  const granted = await requestNotificationPermission();
  if (!granted) return [];

  const times = buildReminderTimes(settings.wakeHour, settings.sleepHour);
  const entries: HydrationReminderEntry[] = [];

  for (const { hour, minute } of times) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'hydration check',
          body: 'drink a glass of water. recovery happens when you stay hydrated.',
          sound: false,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      entries.push({ id, hour, minute });
    } catch {
      // scheduling individual reminders is best-effort
    }
  }

  return entries;
}

export async function cancelWaterReminders(entries: HydrationReminderEntry[]): Promise<void> {
  await Promise.allSettled(entries.map(e => Notifications.cancelScheduledNotificationAsync(e.id)));
}

export async function cancelRemainingRemindersToday(entries: HydrationReminderEntry[]): Promise<void> {
  const nowHour = new Date().getHours();
  const remaining = entries.filter(e => e.hour > nowHour);
  await cancelWaterReminders(remaining);
}
