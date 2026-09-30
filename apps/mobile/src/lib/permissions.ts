import * as Tracking from 'expo-tracking-transparency';
import { Linking, Platform } from 'react-native';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'unavailable';

// The only file that touches the Expo permission modules. Anything they cannot do where the app
// is running (Expo Go gaps, Android having no ATT) comes back as `unavailable`.

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;

// Loaded on first use, not at import: in Expo Go on Android the module throws while loading
// (remote push was removed from Expo Go there), and a static import would take the app with it.
function loadNotifications(): NotificationsModule | null {
  if (notificationsModule === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy load
      notificationsModule = require('expo-notifications') as NotificationsModule;
    } catch {
      notificationsModule = null;
    }
  }
  return notificationsModule;
}

function toStatus(response: { granted: boolean; status: string }): PermissionStatus {
  if (response.granted) return 'granted';
  return response.status === 'undetermined' ? 'undetermined' : 'denied';
}

export async function getNotificationStatus(): Promise<PermissionStatus> {
  try {
    const notifications = loadNotifications();
    return notifications ? toStatus(await notifications.getPermissionsAsync()) : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function requestNotifications(): Promise<PermissionStatus> {
  try {
    const notifications = loadNotifications();
    return notifications ? toStatus(await notifications.requestPermissionsAsync()) : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export async function getTrackingStatus(): Promise<PermissionStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';
  try {
    return toStatus(await Tracking.getTrackingPermissionsAsync());
  } catch {
    return 'unavailable';
  }
}

export async function requestTracking(): Promise<PermissionStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';
  try {
    return toStatus(await Tracking.requestTrackingPermissionsAsync());
  } catch {
    return 'unavailable';
  }
}

export function openSystemSettings(): Promise<void> {
  return Linking.openSettings();
}
