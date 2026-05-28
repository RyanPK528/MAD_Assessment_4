import { useThemeContext } from '@/components/ThemeContext';

export function useTheme() {
  return useThemeContext().colors;
}
