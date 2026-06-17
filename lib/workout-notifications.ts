import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function startActiveWorkoutNotification(
  sessionName: string,
  elapsedSeconds: number,
  completedSets: number,
  totalSets: number
) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const minutes = Math.floor(elapsedSeconds / 60);
  const timeStr = `${minutes} min`;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('active-workout', {
      name: 'Active Workout Tracker',
      importance: Notifications.AndroidImportance.LOW,
      showBadge: false,
      enableVibrate: false,
    });
  }

  await Notifications.scheduleNotificationAsync({
    identifier: 'active-workout',
    content: {
      title: `tappd in: ${sessionName}`,
      body: `Time: ${timeStr}  ·  Sets: ${completedSets}/${totalSets}`,
      data: { type: 'active-workout' },
      sticky: true,
    },
    trigger: null,
  });
}

export async function stopActiveWorkoutNotification() {
  if (Platform.OS === 'web') return;
  await Notifications.dismissNotificationAsync('active-workout');
}

export async function sendRestTimerCompleteNotification(seconds: number) {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rest-timer', {
      name: 'Rest Timer Alert',
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest is over!',
      body: `Your ${seconds}s rest timer has completed. Time for your next set!`,
      data: { type: 'rest-complete' },
    },
    trigger: null,
  });
}
