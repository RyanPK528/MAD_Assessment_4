import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/app-icon';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, ThemeTokens } from '@/constants/theme';

type ActivityTab = 'overview' | 'activity' | 'submission';

interface ActivityLayoutProps {
  activityName: string;
  overviewContent: React.ReactNode;
  activityContent: React.ReactNode;
  submissionContent: React.ReactNode;
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
}: ActivityLayoutProps) {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');

  const tabContent =
    activeTab === 'overview' ? overviewContent : activeTab === 'activity' ? activityContent : submissionContent;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
          <Pressable
            onPress={() => router.replace('/(tabs)/activities')}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.75 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevron.left" tintColor={theme.textPrimary} size={22} />
          </Pressable>
          <ThemedText type="subtitle" style={[styles.headerTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {activityName}
          </ThemedText>
        </View>

        <View style={[styles.tabContainer, { borderBottomColor: theme.border }]}>
          {(Object.keys(TAB_LABELS) as ActivityTab[]).map((tab) => {
            const selected = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tabButton,
                  selected && { borderBottomColor: theme.accent },
                ]}
              >
                <ThemedText
                  type="smallBold"
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
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: ThemeTokens.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  contentScrollView: { flex: 1 },
  contentContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
