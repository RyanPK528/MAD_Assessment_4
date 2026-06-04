import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { useUiStyles } from '@/hooks/use-ui-styles';

interface AppCardProps {
  children: ReactNode;
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({ children, elevated = true, style }: AppCardProps) {
  const ui = useUiStyles();

  return <View style={[elevated ? ui.card : ui.cardFlat, style]}>{children}</View>;
}
