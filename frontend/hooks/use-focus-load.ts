import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

/** Runs an async loader whenever the screen gains focus (avoids mount-only useEffect fetch). */
export function useFocusLoad(load: () => void | Promise<void>) {
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
}
