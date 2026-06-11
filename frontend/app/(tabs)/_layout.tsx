import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { SpacingScale, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context/lib/typescript/src/SafeAreaContext';

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
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
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: SpacingScale.xs,
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
