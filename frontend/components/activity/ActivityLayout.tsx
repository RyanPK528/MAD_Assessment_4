import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { SymbolView } from 'expo-symbols';

interface ActivityLayoutProps {
  activityName: string;
  overviewContent: React.ReactNode;
  activityContent: React.ReactNode;
}

export function ActivityLayout({ activityName, overviewContent, activityContent }: ActivityLayoutProps) {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <ThemedView style={[styles.header, { backgroundColor: theme.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <SymbolView
            tintColor={theme.text}
            name={{ ios: 'arrow.backward', android: 'arrow.left', web: 'arrow.left' }}
            size={24}
          />
        </Pressable>
        <ThemedText type="title" style={styles.headerTitle}>{activityName}</ThemedText>
      </ThemedView>

      {/* Navigation Tabs */}
      <ThemedView style={[styles.tabContainer, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
        <Pressable
          onPress={() => setActiveTab('overview')}
          style={[
            styles.tabButton,
            { borderBottomColor: activeTab === 'overview' ? theme.accent : 'transparent' },
          ]}
        >
          <ThemedText
            type="smallBold"
            style={{ color: activeTab === 'overview' ? theme.accent : theme.textPrimary }}
          >
            Overview
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('activity')}
          style={[
            styles.tabButton,
            { borderBottomColor: activeTab === 'activity' ? theme.accent : 'transparent' },
          ]}
        >
          <ThemedText
            type="smallBold"
            style={{ color: activeTab === 'activity' ? theme.accent : theme.textPrimary }}
          >
            Activity
          </ThemedText>
        </Pressable>
      </ThemedView>

      {/* Content */}
      <ScrollView style={styles.contentScrollView}>
        {activeTab === 'overview' ? overviewContent : activityContent}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.four, paddingTop: Spacing.six, gap: Spacing.two },
  backButton: { padding: Spacing.one },
  headerTitle: { flex: 1 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1 },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
  },
  contentScrollView: { flex: 1, paddingHorizontal: Spacing.four, paddingBottom: Spacing.four },
});