import { RefreshControl, ScrollView, ScrollViewProps, StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpacingScale } from '@/constants/theme';
import { useUiStyles } from '@/hooks/use-ui-styles';
import { getTabBarTotalHeight } from '@/utils/safeArea';

interface ScreenContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Extra scroll padding so content clears the bottom tab bar (default true). */
  reserveTabBarSpace?: boolean;
}

export function ScreenContainer({
  children,
  refreshing,
  onRefresh,
  contentStyle,
  edges = ['top'],
  reserveTabBarSpace = true,
  ...scrollProps
}: ScreenContainerProps) {
  const ui = useUiStyles();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView edges={edges} style={ui.screen}>
      <ScrollView
        contentContainerStyle={[
          ui.screenContent,
          {
            paddingBottom: reserveTabBarSpace
              ? getTabBarTotalHeight(insets) + SpacingScale.md
              : SpacingScale.huge,
          },
          contentStyle,
        ]}
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
