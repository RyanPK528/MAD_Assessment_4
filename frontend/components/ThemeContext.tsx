import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark';

type ThemeContextType = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  colors: typeof Colors.light;
  spacing: typeof Spacing;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const defaultMode: ThemeMode = systemScheme === 'dark' ? 'dark' : 'light';
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'light' ? 'dark' : 'light'));
  }, []);

  const colors = useMemo(() => Colors[mode], [mode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode, colors, spacing: Spacing }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }

  return context;
}
