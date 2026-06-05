/**
 * Notification Service
 * Uses expo-notifications for local push notifications.
 *
 * IMPORTANT: expo-notifications was removed from Expo Go in SDK 53+.
 * This service gracefully falls back to in-app Alert dialogs when the
 * native module is unavailable. Full push notification functionality
 * requires a Development Build.
 */
import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';

/**
 * Attempt to load expo-notifications safely.
 * Returns the module or null if unavailable.
 */
async function getNotificationsModule() {
  try {
    const mod = await import('expo-notifications');
    // Test if the module actually works by calling a safe method
    await mod.getPermissionsAsync();
    return mod;
  } catch {
    return null;
  }
}

/** Cache for whether notifications are available */
let _notificationsAvailable: boolean | null = null;
let _notificationsModule: Awaited<ReturnType<typeof getNotificationsModule>> = null;

async function ensureModule() {
  if (_notificationsAvailable === null) {
    _notificationsModule = await getNotificationsModule();
    _notificationsAvailable = _notificationsModule !== null;

    // Set handler if available
    if (_notificationsModule) {
      _notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  }
  return _notificationsModule;
}

/**
 * Whether the notifications native module is available.
 */
export function isNotificationsAvailable(): boolean {
  return _notificationsAvailable === true;
}

/**
 * Request notification permission.
 * Returns the token string or null if denied/unavailable.
 */
export async function registerForNotifications(): Promise<string | null> {
  const Notifications = await ensureModule();
  if (!Notifications) {
    console.log('[Notifications] Unavailable in Expo Go. Using Alert fallback.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('stemm-lab', {
      name: 'STEMM Lab Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    // Token retrieval may fail on simulators
    return null;
  }
}

/**
 * Schedule a local notification after a delay.
 * Falls back to an in-app Alert if notifications are unavailable (Expo Go).
 *
 * @param title - Notification title
 * @param body - Notification body text
 * @param delaySec - Seconds from now to fire (default 5)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  delaySec = 5,
): Promise<string | null> {
  const Notifications = await ensureModule();

  if (!Notifications) {
    // Fallback: show an in-app Alert instead
    setTimeout(() => {
      Alert.alert(title, body);
    }, delaySec * 1000);
    return null;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delaySec,
    },
  });
  return id;
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  const Notifications = await ensureModule();
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * React hook that listens for incoming notifications while the component is mounted.
 * Returns null for lastNotification if notifications are unavailable.
 */
export function useNotificationListener() {
  const [lastNotification, setLastNotification] = useState<unknown | null>(null);
  const listenerRef = useRef<{ remove: () => void } | null>(null);
  const responseRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    let mounted = true;

    void ensureModule().then((Notifications) => {
      if (!Notifications || !mounted) return;

      listenerRef.current = Notifications.addNotificationReceivedListener((notification) => {
        if (mounted) setLastNotification(notification);
      });

      responseRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
        if (mounted) setLastNotification(response.notification);
      });
    });

    return () => {
      mounted = false;
      listenerRef.current?.remove();
      responseRef.current?.remove();
    };
  }, []);

  return { lastNotification };
}
