import { RefreshControl, ScrollView, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUiStyles } from '@/hooks/use-ui-styles';

interface ScreenContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function ScreenContainer({
  children,
  refreshing,
  onRefresh,
  contentStyle,
  edges = ['top'],
  ...scrollProps
}: ScreenContainerProps) {
  const ui = useUiStyles();

  return (
    <SafeAreaView edges={edges} style={ui.screen}>
      <ScrollView
        contentContainerStyle={[ui.screenContent, contentStyle]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined
        }
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
