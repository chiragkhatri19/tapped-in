import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storage, STORAGE_KEYS } from '@/lib/storage';

// ── Notification channel IDs (Android) ──────────────────────────────────────
const CHANNELS = {
  WATER: 'water-reminders',
  MEAL: 'meal-nudges',
  BEDTIME: 'bedtime-wind-down',
  STREAK: 'streak-risk',
} as const;

// ── Permission ───────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNELS.WATER, {
      name: 'Water reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.MEAL, {
      name: 'Meal nudges',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.BEDTIME, {
      name: 'Bedtime wind-down',
      importance: Notifications.AndroidImportance.LOW,
    });
    await Notifications.setNotificationChannelAsync(CHANNELS.STREAK, {
      name: 'Streak at risk',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Opt-in flags (stored in MMKV) ────────────────────────────────────────────
const OPT_IN_KEYS = {
  water: 'notif_opt_water',
  meal: 'notif_opt_meal',
  bedtime: 'notif_opt_bedtime',
  streak: 'notif_opt_streak',
} as const;

export type NotifCategory = keyof typeof OPT_IN_KEYS;

export function getNotifOptIn(category: NotifCategory): boolean {
  return storage.getBoolean(OPT_IN_KEYS[category]) ?? false;
}

export function setNotifOptIn(category: NotifCategory, enabled: boolean): void {
  storage.set(OPT_IN_KEYS[category], enabled);
}

// ── Quiet hours: 22:00–07:00 by default ─────────────────────────────────────
function isQuietHours(): boolean {
  const h = new Date().getHours();
  return h >= 22 || h < 7;
}

// ── Water reminders (N2) ─────────────────────────────────────────────────────
export async function scheduleWaterReminders(): Promise<void> {
  if (!getNotifOptIn('water')) return;
  await Notifications.cancelScheduledNotificationAsync('water-reminder').catch(() => null);

  // Remind every 2 hours between 8am and 8pm
  for (let h = 8; h <= 20; h += 2) {
    await Notifications.scheduleNotificationAsync({
      identifier: `water-${h}`,
      content: {
        title: 'hydration check',
        body: "how's the water intake going? tap to log a glass.",
        sound: false,
        ...(Platform.OS === 'android' && { channelId: CHANNELS.WATER }),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: 0 },
    });
  }
}

// ── Meal nudge (N2) ──────────────────────────────────────────────────────────
export async function scheduleMealNudge(): Promise<void> {
  if (!getNotifOptIn('meal')) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'meal-nudge-lunch',
    content: {
      title: 'lunch logged?',
      body: 'keep the streak alive — log what you eat.',
      sound: false,
      ...(Platform.OS === 'android' && { channelId: CHANNELS.MEAL }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 13, minute: 0 },
  });
}

// ── Bedtime wind-down (N3) ───────────────────────────────────────────────────
export async function scheduleBedtimeWindDown(bedtimeHour = 22, bedtimeMin = 30): Promise<void> {
  if (!getNotifOptIn('bedtime')) return;
  // Notify 30 minutes before bedtime
  const notifMin = bedtimeMin - 30 < 0 ? bedtimeMin + 30 : bedtimeMin - 30;
  const notifHour = bedtimeMin - 30 < 0 ? bedtimeHour - 1 : bedtimeHour;

  await Notifications.scheduleNotificationAsync({
    identifier: 'bedtime-wind-down',
    content: {
      title: 'wind down time',
      body: 'your recovery ring closes with a full night\'s sleep. screen off soon.',
      sound: false,
      ...(Platform.OS === 'android' && { channelId: CHANNELS.BEDTIME }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: notifHour, minute: notifMin },
  });
}

// ── Streak risk nudge (N3) ───────────────────────────────────────────────────
export async function scheduleStreakRiskNudge(): Promise<void> {
  if (!getNotifOptIn('streak')) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'streak-risk',
    content: {
      title: 'streak at risk',
      body: 'one ring left to close. finish strong today.',
      sound: true,
      ...(Platform.OS === 'android' && { channelId: CHANNELS.STREAK }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
  });
}

// ── Per-session update: cancel or re-schedule with accurate ring copy ─────────
// Called whenever ring state changes. Keeps the 8pm nudge honest.
export async function updateStreakRiskNudge(ringsClosed: number, dayComplete: boolean): Promise<void> {
  if (!getNotifOptIn('streak')) return;
  if (isQuietHours()) return;

  // Cancel if day is already done
  if (dayComplete) {
    await Notifications.cancelScheduledNotificationAsync('streak-risk').catch(() => null);
    return;
  }

  // Only nudge when 2 or 3 rings are closed (avoids false "one ring left" for 0–1 rings)
  if (ringsClosed < 2 || ringsClosed >= 4) return;

  const remaining = 4 - ringsClosed;
  const body = remaining === 1
    ? 'one ring left to close. finish strong today.'
    : `${remaining} rings left to close. finish strong today.`;

  await Notifications.cancelScheduledNotificationAsync('streak-risk').catch(() => null);
  await Notifications.scheduleNotificationAsync({
    identifier: 'streak-risk',
    content: {
      title: 'streak at risk',
      body,
      sound: true,
      ...(Platform.OS === 'android' && { channelId: CHANNELS.STREAK }),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 20, minute: 0 },
  });
}

// ── Cancel all for today (call when all rings close) ─────────────────────────
export async function cancelForDay(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter((n) =>
    [CHANNELS.WATER, CHANNELS.MEAL, CHANNELS.STREAK].some((ch) =>
      n.identifier.startsWith(ch.split('-')[0]),
    ),
  );
  await Promise.all(toCancel.map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}
