import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeProvider } from '@/components/ThemeContext';
import { ensureSyncQueueInitialized, syncPendingResults } from '@/services/activityResultService';

export default function RootLayout() {
  useEffect(() => {
    void ensureSyncQueueInitialized().then(() => syncPendingResults());
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
