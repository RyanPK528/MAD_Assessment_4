import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const userName = 'Alya';
const currentGroup = {
  name: 'Group Orion',
  grade: 10,
  activitiesCompleted: 4,
  activitiesTotal: 7,
  memberCount: 12,
};

export default function DashboardScreen() {
  const theme = useTheme();
  const progressPercentage = Math.round((currentGroup.activitiesCompleted / currentGroup.activitiesTotal) * 100);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }] }>
      <View style={styles.headerRow}>
        <View style={styles.greeting}>
          <ThemedText type="title">Hi {userName}</ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>Welcome back to your STEM adventure.</ThemedText>
        </View>
      </View>

      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle">Current Group</ThemedText>
          <ThemedText type="smallBold">Grade {currentGroup.grade}</ThemedText>
        </View>
        <ThemedText type="title" style={styles.groupName}>{currentGroup.name}</ThemedText>
        <View style={styles.progressSection}>
          <View style={styles.progressLabelRow}>
            <ThemedText type="body">{currentGroup.activitiesCompleted} / {currentGroup.activitiesTotal} Activities Completed</ThemedText>
            <ThemedText type="smallBold">{progressPercentage}%</ThemedText>
          </View>
          <View style={[styles.progressBarBackground, { backgroundColor: theme.backgroundSelected }]}> 
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%`, backgroundColor: theme.accent }]} />
          </View>
        </View>
        <View style={[styles.groupStatsRow, { borderTopColor: theme.border }]}> 
          <ThemedText type="small">Member count</ThemedText>
          <ThemedText type="smallBold">{currentGroup.memberCount}</ThemedText>
        </View>
      </ThemedView>

      <View style={styles.quickStartLabel}>
        <ThemedText type="subtitle">Quick start</ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>Jump straight into work.</ThemedText>
      </View>

      <View style={styles.quickActionsRow}>
        <Link href="/activities" style={[styles.actionCard, styles.primaryAction]}> 
          <ThemedText type="subtitle">Activities</ThemedText>
          <ThemedText type="small">Browse challenges</ThemedText>
        </Link>
        <Link href="/leaderboard" style={[styles.actionCard, styles.secondaryAction]}> 
          <ThemedText type="subtitle">Leaderboard</ThemedText>
          <ThemedText type="small">See team rankings</ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerRow: {
    gap: Spacing.two,
  },
  greeting: {
    gap: Spacing.one,
  },
  subtitle: {
    marginTop: Spacing.one,
  },
  card: {
    width: '100%',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    marginTop: Spacing.two,
  },
  progressSection: {
    gap: Spacing.two,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  groupStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  quickStartLabel: {
    gap: Spacing.one,
  },
  quickActionsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  primaryAction: {
    backgroundColor: '#3E78FF',
  },
  secondaryAction: {
    backgroundColor: '#1F1F31',
  },
});
