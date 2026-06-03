import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/ui/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Layout, Radii, SpacingScale } from '@/constants/theme';

type ActivityTab = 'overview' | 'activity' | 'submission';

export type { ActivityTab };

interface ActivityLayoutProps {
  activityName: string;
  overviewContent: React.ReactNode;
  activityContent: React.ReactNode;
  submissionContent: React.ReactNode;
  activeTab?: ActivityTab;
  onTabChange?: (tab: ActivityTab) => void;
}

const TAB_LABELS: Record<ActivityTab, string> = {
  overview: 'Overview',
  activity: 'Activity',
  submission: 'Submission',
};

export function ActivityLayout({
  activityName,
  overviewContent,
  activityContent,
  submissionContent,
  activeTab: controlledTab,
  onTabChange,
}: ActivityLayoutProps) {
  const router = useRouter();
  const theme = useTheme();
  const [internalTab, setInternalTab] = useState<ActivityTab>('overview');
  const activeTab = controlledTab ?? internalTab;

  const setActiveTab = (tab: ActivityTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const tabContent =
    activeTab === 'overview' ? overviewContent : activeTab === 'activity' ? activityContent : submissionContent;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable
            onPress={() => router.replace('/(tabs)/activities')}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.75 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back to activities"
          >
            <AppIcon name="chevron.left" tintColor={theme.textPrimary} size={22} />
          </Pressable>
          <ThemedText type="cardTitle" style={styles.headerTitle} numberOfLines={1}>
            {activityName}
          </ThemedText>
        </View>

        <View style={[styles.tabContainer, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
          {(Object.keys(TAB_LABELS) as ActivityTab[]).map((tab) => {
            const selected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                style={[
                  styles.tabButton,
                  selected && { borderBottomColor: theme.accent, backgroundColor: theme.accentMuted },
                ]}
              >
                <ThemedText
                  type="captionBold"
                  style={{ color: selected ? theme.accent : theme.textSecondary }}
                >
                  {TAB_LABELS[tab]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.contentScrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {tabContent}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { width: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: SpacingScale.sm,
    gap: SpacingScale.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: Layout.touchTargetMin,
    height: Layout.touchTargetMin,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SpacingScale.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: SpacingScale.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    borderTopLeftRadius: Radii.sm,
    borderTopRightRadius: Radii.sm,
    minHeight: Layout.buttonHeightSm,
    justifyContent: 'center',
  },
  contentScrollView: { flex: 1 },
  contentContainer: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: SpacingScale.md,
    paddingBottom: SpacingScale.huge,
  },
});
