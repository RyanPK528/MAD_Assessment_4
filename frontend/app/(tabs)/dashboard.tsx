import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaView, ScrollView, StyleSheet, View, TouchableOpacity, RefreshControl } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { useThemeContext } from '@/components/ThemeContext';
import { getFirebaseAuth, isFirebaseConfigured } from '@/config/firebaseNative';
import {
  fetchCurrentGroupStats,
  fetchLeaderboardEntries,
  syncPendingResults,
} from '@/services/activityResultService';
import { Spacing } from '@/constants/theme';

export default function DashboardScreen() {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeContext();
  const isDark = mode === 'dark';

  const [userName, setUserName] = useState('Student');
  const [currentGroup, setCurrentGroup] = useState<Awaited<ReturnType<typeof fetchCurrentGroupStats>>>(null);
  const [leaderboardPreview, setLeaderboardPreview] = useState<{ rank: number; name: string; score: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await syncPendingResults();
    const auth = getFirebaseAuth();
    if (auth && isFirebaseConfigured()) {
      const user = auth.currentUser;
      if (user) {
        const { doc, getDoc } = await import('firebase/firestore');
        const { getFirebaseFirestore } = await import('@/config/firebaseNative');
        const db = getFirebaseFirestore();
        if (db) {
          const userSnap = await getDoc(doc(db, 'users', user.uid));
          if (userSnap.exists()) {
            setUserName(String(userSnap.data().firstName ?? 'Student'));
          }
        }
      }
    }
    const [group, board] = await Promise.all([fetchCurrentGroupStats(), fetchLeaderboardEntries()]);
    setCurrentGroup(group);
    setLeaderboardPreview(board.slice(0, 3).map((e) => ({ rank: e.rank, name: e.name, score: e.completionPercent })));
  }, []);

  useEffect(() => {
    void load();
    const auth = getFirebaseAuth();
    if (!auth) {
      return;
    }
    const unsub = onAuthStateChanged(auth, () => void load());
    return unsub;
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const completedActivities = currentGroup?.activitiesCompleted ?? 0;
  const activitiesTotal = currentGroup?.activitiesTotal ?? 7;
  const progressPercentage = Math.round((completedActivities / activitiesTotal) * 100);

  return (
    <ThemedView style={[styles.outer, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.header}>
            <View>
              <ThemedText type="small" style={[styles.greeting, { color: theme.textSecondary }]}>
                Good afternoon, {userName}
              </ThemedText>
              <ThemedText type="subtitle" style={[styles.teamName, { color: theme.textPrimary }]}>
                {currentGroup?.name ?? 'No group yet'}
              </ThemedText>
            </View>
            <TouchableOpacity style={[styles.themeToggle, { backgroundColor: theme.backgroundSelected }]} onPress={toggleMode}>
              <SymbolView
                name={isDark ? 'sun.max.fill' : 'moon.fill'}
                size={20}
                tintColor={isDark ? '#FFD54F' : theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ThemedText type="smallBold">Completed</ThemedText>
              <ThemedText type="subtitle" style={styles.statValue}>
                {completedActivities}/{activitiesTotal}
              </ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ThemedText type="smallBold">Members</ThemedText>
              <ThemedText type="subtitle" style={styles.statValue}>
                {currentGroup?.memberCount ?? '—'}
              </ThemedText>
            </View>
          </View>

          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: theme.textPrimary }]}>Quick start</ThemedText>
          <View style={styles.buttonContainer}>
            <Link href="/activities" style={[styles.actionButton, { backgroundColor: theme.accent }]}>
              <ThemedText type="subtitle">View activities</ThemedText>
            </Link>
          </View>

          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: theme.textPrimary }]}>Leaderboard preview</ThemedText>
          <View style={[styles.leaderboardPreview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.leaderboardHeaderRow}>
              <ThemedText type="smallBold" style={{ color: theme.textPrimary }}>Top teams</ThemedText>
              <Link href="/leaderboard" style={styles.leaderboardLink}>
                <ThemedText type="small" style={{ color: theme.accent }}>View all</ThemedText>
                <ThemedText type="small" style={[styles.leaderboardArrow, { color: theme.accent }]}>›</ThemedText>
              </Link>
            </View>
            {leaderboardPreview.length === 0 ? (
              <ThemedText type="small" style={{ color: theme.textSecondary }}>No rankings yet.</ThemedText>
            ) : (
              leaderboardPreview.map((team) => (
                <View key={team.rank} style={styles.leaderboardItem}>
                  <ThemedText type="subtitle" style={[styles.rank, { color: theme.accent }]}>{team.rank}</ThemedText>
                  <View style={styles.teamInfo}>
                    <ThemedText type="body" style={{ color: theme.textPrimary }}>{team.name}</ThemedText>
                  </View>
                  <ThemedText type="body" style={{ color: theme.success }}>{team.score}%</ThemedText>
                </View>
              ))
            )}
            <View style={[styles.progressContainer, { backgroundColor: theme.backgroundSelected }]}>
              <View style={styles.progressLabelRow}>
                <ThemedText type="small">Group progress</ThemedText>
                <ThemedText type="smallBold">{progressPercentage}%</ThemedText>
              </View>
              <View style={[styles.progressBarBackground, { backgroundColor: theme.background }]}>
                <View style={[styles.progressBarFill, { width: `${progressPercentage}%`, backgroundColor: theme.accent }]} />
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  greeting: { fontSize: 14, marginBottom: Spacing.one },
  teamName: { fontSize: 28, lineHeight: 34 },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  statBox: {
    flex: 1,
    minWidth: '30%',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
  },
  statValue: { marginTop: Spacing.two, fontSize: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  buttonContainer: { gap: Spacing.three },
  actionButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardPreview: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.two,
  },
  leaderboardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  leaderboardLink: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  leaderboardArrow: { fontSize: 18, lineHeight: 20 },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  rank: { minWidth: 36, fontWeight: '700' },
  teamInfo: { flex: 1, marginHorizontal: Spacing.two },
  progressContainer: { marginTop: Spacing.three, borderRadius: Spacing.three, padding: Spacing.three },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  progressBarBackground: { height: 10, borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 999 },
});
