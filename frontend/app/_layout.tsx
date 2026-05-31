import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeProvider } from '@/components/ThemeContext';
import { ensureSyncQueueInitialized } from '@/services/sqliteService';

export default function RootLayout() {
  useEffect(() => {
    void ensureSyncQueueInitialized().then(async () => {
      try {
        const { syncPendingResults } = await import('@/services/activityResultService');
        await syncPendingResults();
      } catch {
        // Firebase optional — local SQLite still works.
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AnimatedSplashOverlay />
        <Slot />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
