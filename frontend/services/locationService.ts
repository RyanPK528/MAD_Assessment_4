/**
 * GPS Location Service
 * Uses expo-location to tag activity attempts with coordinates.
 * Provides permission handling and a React hook for one-shot location capture.
 */
import { useState, useCallback } from 'react';
import * as Location from 'expo-location';

export interface GpsTag {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

export interface LocationState {
  /** Current GPS tag (null until captured) */
  gpsTag: GpsTag | null;
  /** Whether a location request is in-flight */
  loading: boolean;
  /** Human-readable error if permission denied or hardware unavailable */
  error: string | null;
}

/**
 * Request foreground location permission.
 * Returns true if granted.
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

/**
 * React hook for tagging the current GPS location.
 * Call `captureLocation()` when user starts an activity attempt.
 *
 * Usage:
 *   const { gpsTag, loading, error, captureLocation } = useLocationTag();
 */
export function useLocationTag() {
  const [state, setState] = useState<LocationState>({
    gpsTag: null,
    loading: false,
    error: null,
  });

  const captureLocation = useCallback(async () => {
    setState({ gpsTag: null, loading: true, error: null });

    const granted = await requestLocationPermission();
    if (!granted) {
      setState({ gpsTag: null, loading: false, error: 'Location permission denied.' });
      return null;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const tag: GpsTag = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
        timestamp: loc.timestamp,
      };
      setState({ gpsTag: tag, loading: false, error: null });
      return tag;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to get location.';
      setState({ gpsTag: null, loading: false, error: msg });
      return null;
    }
  }, []);

  return { ...state, captureLocation };
}
