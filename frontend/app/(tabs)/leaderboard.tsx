import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/app-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getFirebaseAuth } from '@/config/firebaseNative';
import {
  fetchCurrentGroupStats,
  fetchLeaderboardEntries,
  LeaderboardEntry,
  syncPendingResults,
} from '@/services/activityResultService';
import { Layout, Radii, SpacingScale, getShadowStyle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STICKY_BANNER_HEIGHT = 132;

export default function LeaderboardScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentGroup, setCurrentGroup] = useState<Awaited<ReturnType<typeof fetchCurrentGroupStats>>>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await syncPendingResults();
    const [board, group] = await Promise.all([fetchLeaderboardEntries(), fetchCurrentGroupStats()]);
    setEntries(board);
    setCurrentGroup(group);
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, () => {
      void load();
    });
    return unsub;
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const currentEntry = currentGroup
    ? entries.find((entry) => entry.groupId === currentGroup.groupId)
    : null;
  const currentRank = currentEntry?.rank ?? null;
  const currentCompletion = currentEntry?.completionPercent ?? currentGroup?.completionPercent ?? 0;

  const podiumHeights = { first: 120, second: 100, third: 88 };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safeHeader}>
        <ThemedText type="pageTitle">Leaderboard</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          Teams ranked by activity completion
        </ThemedText>
      </SafeAreaView>

      {podium.length >= 3 ? (
        <View style={styles.podiumRow}>
          {[
            { data: podium[1], rank: 2, height: podiumHeights.second, style: styles.podiumSecond },
            { data: podium[0], rank: 1, height: podiumHeights.first, style: styles.podiumFirst },
            { data: podium[2], rank: 3, height: podiumHeights.third, style: styles.podiumThird },
          ].map(({ data, rank, height, style }) => (
            <View
              key={rank}
              style={[
                styles.podiumCard,
                style,
                {
                  height,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  ...getShadowStyle('card', theme.shadow),
                },
              ]}
            >
              <ThemedText type="stat" themeColor="accent">
                {rank}
              </ThemedText>
              <ThemedText type="captionBold" numberOfLines={2} style={styles.podiumName}>
                {data?.name}
              </ThemedText>
              <ThemedText type="metadata" themeColor="textSecondary">
                {data?.completionPercent}%
              </ThemedText>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyPodium}>
          <EmptyState title="No rankings yet" message="Seed data or complete activities to populate the board." />
        </View>
      )}

      <FlatList
        data={rest}
        keyExtractor={(item) => item.groupId}
        style={styles.list}
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingBottom: currentGroup ? STICKY_BANNER_HEIGHT + insets.bottom + SpacingScale.md : SpacingScale.md,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <AppCard elevated={false} style={styles.rowItem}>
            <View style={[styles.rankBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="captionBold">{item.rank}</ThemedText>
            </View>
            <View style={styles.rankText}>
              <ThemedText type="bodyMedium">{item.name}</ThemedText>
              <ThemedText type="metadata" themeColor="textSecondary">
                Grade {item.grade} · {item.completedActivitiesCount}/7
              </ThemedText>
            </View>
            <ThemedText type="captionBold" themeColor="accent">
              {item.completionPercent}%
            </ThemedText>
          </AppCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: SpacingScale.xs }} />}
        ListEmptyComponent={
          entries.length === 0 ? (
            <EmptyState title="No teams listed" message="Complete activities with your group to appear here." />
          ) : null
        }
      />

      {currentGroup ? (
        <ThemedView
          style={[
            styles.rankBanner,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.accent,
              ...getShadowStyle('banner', theme.shadow),
              paddingBottom: Math.max(insets.bottom, SpacingScale.md),
            },
          ]}
        >
          <View style={styles.rankBannerHeader}>
            <View style={[styles.rankPill, { backgroundColor: theme.accent }]}>
              <ThemedText type="captionBold" style={{ color: theme.onAccent }}>
                {currentRank ? `#${currentRank}` : '—'}
              </ThemedText>
            </View>
            <View style={styles.rankBannerText}>
              <ThemedText type="metadata" themeColor="textSecondary">
                Your team
              </ThemedText>
              <ThemedText type="cardTitle" numberOfLines={1}>
                {currentGroup.name}
              </ThemedText>
            </View>
            <ThemedText type="sectionTitle" themeColor="accent">
              {currentCompletion}%
            </ThemedText>
          </View>
          <ProgressBar value={currentCompletion} showPercent={false} />
          <ThemedText type="metadata" themeColor="textSecondary">
            {currentGroup.activitiesCompleted} of {currentGroup.activitiesTotal} activities complete
          </ThemedText>
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeHeader: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: SpacingScale.xl,
    paddingBottom: SpacingScale.md,
    gap: SpacingScale.xxs,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: SpacingScale.xs,
    paddingHorizontal: Layout.screenPadding,
    marginBottom: SpacingScale.md,
  },
  podiumCard: {
    flex: 1,
    borderRadius: Radii.lg,
    padding: SpacingScale.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: SpacingScale.xxs,
  },
  podiumFirst: {
    marginBottom: SpacingScale.sm,
  },
  podiumSecond: {
    opacity: 0.95,
  },
  podiumThird: {
    opacity: 0.9,
  },
  podiumName: {
    textAlign: 'center',
  },
  emptyPodium: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: SpacingScale.md,
  },
  list: { flex: 1 },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SpacingScale.sm,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    flex: 1,
    gap: SpacingScale.xxs,
  },
  rankBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 2,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: SpacingScale.md,
    gap: SpacingScale.sm,
  },
  rankBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SpacingScale.sm,
  },
  rankPill: {
    minWidth: 52,
    paddingHorizontal: SpacingScale.sm,
    paddingVertical: SpacingScale.xs,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  rankBannerText: {
    flex: 1,
    gap: SpacingScale.xxs,
  },
});
