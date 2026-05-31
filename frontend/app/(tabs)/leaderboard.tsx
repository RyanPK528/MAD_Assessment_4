import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { firebaseAuth } from '@/config/firebaseNative';
import {
  fetchCurrentGroupStats,
  fetchLeaderboardEntries,
  LeaderboardEntry,
  syncPendingResults,
} from '@/services/activityResultService';
import { Spacing } from '@/constants/theme';

export default function LeaderboardScreen() {
  const theme = useTheme();
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
    void load();
    const unsub = onAuthStateChanged(firebaseAuth, () => void load());
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
    ? entries.find((e) => e.name === currentGroup.name)
    : null;

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ThemedText type="title" style={styles.title}>Leaderboard</ThemedText>

      {podium.length >= 3 ? (
        <View style={styles.podiumRow}>
          <View style={[styles.podiumCard, styles.second, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <ThemedText type="subtitle">2</ThemedText>
            <ThemedText type="body">{podium[1]?.name}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{podium[1]?.completionPercent}%</ThemedText>
          </View>
          <View style={[styles.podiumCard, styles.first, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <ThemedText type="subtitle">1</ThemedText>
            <ThemedText type="body">{podium[0]?.name}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{podium[0]?.completionPercent}%</ThemedText>
          </View>
          <View style={[styles.podiumCard, styles.third, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <ThemedText type="subtitle">3</ThemedText>
            <ThemedText type="body">{podium[2]?.name}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{podium[2]?.completionPercent}%</ThemedText>
          </View>
        </View>
      ) : (
        <ThemedText type="body" style={{ color: theme.textSecondary }}>No groups on the leaderboard yet.</ThemedText>
      )}

      <FlatList
        data={rest}
        keyExtractor={(item) => item.groupId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={[styles.rowItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.rankBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="subtitle">{item.rank}</ThemedText>
            </View>
            <View style={styles.rankText}>
              <ThemedText type="body">{item.name}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                Grade {item.grade} • {item.completedActivitiesCount}/7
              </ThemedText>
            </View>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.completionPercent}%</ThemedText>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={[styles.divider, { backgroundColor: theme.border }]} />}
        ListEmptyComponent={
          entries.length === 0 ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, padding: Spacing.four }}>
              Complete activities with your group to appear here.
            </ThemedText>
          ) : null
        }
      />

      {currentGroup && (
        <ThemedView style={[styles.stickyStatus, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <ThemedText type="subtitle">Your group</ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            {currentGroup.name} • grade {currentGroup.grade} • {currentGroup.activitiesCompleted} / {currentGroup.activitiesTotal} complete
            {currentEntry ? ` • ${currentEntry.completionPercent}%` : ''}
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    marginBottom: Spacing.three,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  podiumCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 4,
  },
  first: {
    transform: [{ scale: 1.05 }],
  },
  second: {
    opacity: 0.96,
  },
  third: {
    opacity: 0.92,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  rankText: {
    flex: 1,
    gap: Spacing.one,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
  stickyStatus: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    marginTop: Spacing.four,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },
});
