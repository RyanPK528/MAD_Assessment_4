import { useRouter, Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScreenContainer } from '@/components/ui/screen-container';
import { SectionHeader } from '@/components/ui/section-header';
import { StatCard } from '@/components/ui/stat-card';
import { ThemedText } from '@/components/themed-text';
import { getFirebaseAuth, isFirebaseConfigured } from '@/config/firebaseNative';
import {
  fetchCurrentGroupStats,
  fetchLeaderboardEntries,
  syncPendingResults,
} from '@/services/activityResultService';
import { getUserProfile } from '@/services/authService';
import { Layout, SpacingScale } from '@/constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('Team');
  const [memberPreview, setMemberPreview] = useState('');
  const [currentGroup, setCurrentGroup] = useState<Awaited<ReturnType<typeof fetchCurrentGroupStats>>>(null);
  const [leaderboardPreview, setLeaderboardPreview] = useState<{ rank: number; name: string; score: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await syncPendingResults();
    const auth = getFirebaseAuth();
    if (auth && isFirebaseConfigured()) {
      const user = auth.currentUser;
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setTeamName(profile.teamName);
          setMemberPreview(profile.memberFirstNames.slice(0, 3).join(', '));
        }
      }
    }
    const [group, board] = await Promise.all([fetchCurrentGroupStats(), fetchLeaderboardEntries()]);
    setCurrentGroup(group);
    setLeaderboardPreview(board.slice(0, 3).map((e) => ({ rank: e.rank, name: e.name, score: e.completionPercent })));
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

  const completedActivities = currentGroup?.activitiesCompleted ?? 0;
  const activitiesTotal = currentGroup?.activitiesTotal ?? 7;
  const progressPercentage = Math.round((completedActivities / activitiesTotal) * 100);

  const displayTeamName = currentGroup?.name ?? teamName;

  return (
    <ScreenContainer refreshing={refreshing} onRefresh={onRefresh}>
      <View style={styles.hero}>
        <ThemedText type="pageTitle">Welcome {displayTeamName}!</ThemedText>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Completed" value={`${completedActivities}/${activitiesTotal}`} />
        <StatCard label="Members" value={currentGroup?.memberCount ?? '—'} />
      </View>

      <AppCard>
        <SectionHeader title="Your progress" />
        <ProgressBar value={progressPercentage} label="Activities complete" />
        <ThemedText type="metadata" themeColor="textSecondary">
          {completedActivities} of {activitiesTotal} STEMM challenges finished
        </ThemedText>
      </AppCard>

      <View>
        <SectionHeader title="Quick start" subtitle="Jump into your next challenge" />
        <AppButton label="View activities" onPress={() => router.push('/activities')} />
      </View>

      <AppCard>
        <SectionHeader
          title="Leaderboard"
          subtitle="Top teams this week"
          action={
            <Link href="/leaderboard" asChild>
              <Pressable accessibilityRole="link" accessibilityLabel="View full leaderboard">
                <ThemedText type="link" themeColor="accent">
                  View all
                </ThemedText>
              </Pressable>
            </Link>
          }
        />
        {leaderboardPreview.length === 0 ? (
          <ThemedText type="caption" themeColor="textSecondary">
            No rankings yet. Complete an activity to appear here.
          </ThemedText>
        ) : (
          leaderboardPreview.map((team) => (
            <View key={team.rank} style={styles.leaderboardRow}>
              <ThemedText type="captionBold" themeColor="accent" style={styles.rank}>
                #{team.rank}
              </ThemedText>
              <ThemedText type="bodyMedium" style={styles.teamName}>
                {team.name}
              </ThemedText>
              <ThemedText type="captionBold" themeColor="success">
                {team.score}%
              </ThemedText>
            </View>
          ))
        )}
      </AppCard>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: SpacingScale.xxs,
    marginBottom: SpacingScale.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SpacingScale.sm,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SpacingScale.xs,
    gap: SpacingScale.sm,
  },
  rank: {
    minWidth: 32,
  },
  teamName: {
    flex: 1,
  },
});
