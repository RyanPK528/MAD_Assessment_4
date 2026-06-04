/**
 * Battery Status Service
 * Uses expo-battery to monitor device battery level and charging state.
 * Provides a React hook for easy integration into any screen.
 */
import { useState, useEffect, useRef } from 'react';
import * as Battery from 'expo-battery';

export interface BatteryStatus {
  /** Battery level from 0.0 to 1.0 */
  level: number;
  /** Whether the device is currently charging */
  isCharging: boolean;
  /** Human-readable percentage string e.g. "85%" */
  displayLevel: string;
  /** Whether battery data was successfully loaded */
  isLoaded: boolean;
}

/**
 * React hook that provides real-time battery status.
 * Automatically subscribes to level and charging state changes.
 *
 * Usage:
 *   const { level, isCharging, displayLevel } = useBatteryStatus();
 */
export function useBatteryStatus(): BatteryStatus {
  const [level, setLevel] = useState<number>(-1);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const levelSub = useRef<Battery.Subscription | null>(null);
  const stateSub = useRef<Battery.Subscription | null>(null);

  useEffect(() => {
    let mounted = true;

    // Fetch initial values
    const init = async () => {
      try {
        const [battLevel, battState] = await Promise.all([
          Battery.getBatteryLevelAsync(),
          Battery.getBatteryStateAsync(),
        ]);
        if (!mounted) return;
        setLevel(battLevel);
        setIsCharging(
          battState === Battery.BatteryState.CHARGING ||
          battState === Battery.BatteryState.FULL,
        );
        setIsLoaded(true);
      } catch {
        // Battery API unavailable (e.g. simulator without battery support)
        if (mounted) setIsLoaded(false);
      }
    };

    void init();

    // Subscribe to live updates
    levelSub.current = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      if (mounted) setLevel(batteryLevel);
    });

    stateSub.current = Battery.addBatteryStateListener(({ batteryState }) => {
      if (mounted) {
        setIsCharging(
          batteryState === Battery.BatteryState.CHARGING ||
          batteryState === Battery.BatteryState.FULL,
        );
      }
    });

    return () => {
      mounted = false;
      levelSub.current?.remove();
      stateSub.current?.remove();
    };
  }, []);

  return {
    level,
    isCharging,
    displayLevel: level >= 0 ? `${Math.round(level * 100)}%` : '--',
    isLoaded,
  };
}
