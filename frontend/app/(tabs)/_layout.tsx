import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getBottomTabInset, getTabBarTotalHeight, TAB_BAR_ITEM_BOTTOM_GAP } from '@/utils/safeArea';

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = getBottomTabInset(insets);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: getTabBarTotalHeight(insets),
          paddingBottom: bottomInset + TAB_BAR_ITEM_BOTTOM_GAP,
          paddingTop: 0,
        },
        tabBarLabelStyle: {
          fontSize: Typography.metadata.fontSize,
          lineHeight: Typography.metadata.lineHeight,
          fontWeight: Typography.captionBold.fontWeight,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <AppIcon name="house.fill" tintColor={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => <AppIcon name="list.bullet" tintColor={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => <AppIcon name="chart.bar.fill" tintColor={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <AppIcon name="gearshape.fill" tintColor={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
