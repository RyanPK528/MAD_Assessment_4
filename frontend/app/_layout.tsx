import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeProvider } from '@/components/ThemeContext';
import '@/services/backgroundTaskService';
import { ensureSyncQueueInitialized } from '@/services/sqliteService';

export default function RootLayout() {
  useEffect(() => {
    // Request notification permission on app launch (safe for Expo Go — no-ops if unavailable)
    import('@/services/notificationService').then(({ registerForNotifications }) => {
      void registerForNotifications();
    }).catch(() => {
      // Notification module unavailable
    });

    let removeForegroundSync: (() => void) | undefined;

    void ensureSyncQueueInitialized().then(async () => {
      try {
        const { syncPendingResults } = await import('@/services/activityResultService');
        await syncPendingResults();
      } catch {
        // Firebase optional — local SQLite still works.
      }

      try {
        const { initializeBackgroundSync } = await import('@/services/backgroundTaskService');
        removeForegroundSync = await initializeBackgroundSync();
      } catch {
        // Background fetch unavailable in Expo Go or when denied.
      }
    });

    return () => {
      removeForegroundSync?.();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AnimatedSplashOverlay />
          <Slot />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
