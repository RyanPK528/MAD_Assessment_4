import { SymbolView, SymbolWeight } from 'expo-symbols';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

const ICONS = {
  'house.fill': { ios: 'house.fill', android: 'home', web: 'home' },
  'list.bullet': { ios: 'list.bullet', android: 'list', web: 'list' },
  'chart.bar.fill': { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  'gearshape.fill': { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  'chevron.left': { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  'chevron.right': { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  'moon.fill': { ios: 'moon.fill', android: 'dark_mode', web: 'dark_mode' },
  'sun.max.fill': { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' },
  'arrow.up.right.square': { ios: 'arrow.up.right.square', android: 'open_in_new', web: 'open_in_new' },
} as const;

export type AppIconName = keyof typeof ICONS;

interface AppIconProps {
  name: AppIconName;
  size?: number;
  tintColor?: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}

export function AppIcon({ name, size = 24, tintColor, style, weight }: AppIconProps) {
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={tintColor}
      style={style}
      weight={weight}
    />
  );
}
