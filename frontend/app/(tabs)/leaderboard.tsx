import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const mockLeaderboard = [
  { rank: 1, name: 'Team Nova', grade: 10, completedActivitiesCount: 6, completionPercent: 85.7 },
  { rank: 2, name: 'Group Orion', grade: 11, completedActivitiesCount: 5, completionPercent: 71.4 },
  { rank: 3, name: 'STEM Squad', grade: 10, completedActivitiesCount: 4, completionPercent: 57.1 },
  { rank: 4, name: 'Lab Beta', grade: 9, completedActivitiesCount: 3, completionPercent: 42.8 },
  { rank: 5, name: 'Spark Crew', grade: 10, completedActivitiesCount: 2, completionPercent: 28.6 },
];

export default function LeaderboardScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Leaderboard
      </ThemedText>
      <View style={styles.podiumRow}>
        <View style={[styles.podiumCard, styles.second]}> 
          <ThemedText type="subtitle">2</ThemedText>
          <ThemedText type="body">Group Orion</ThemedText>
          <ThemedText type="small">71.4%</ThemedText>
        </View>
        <View style={[styles.podiumCard, styles.first]}>
          <ThemedText type="subtitle">1</ThemedText>
          <ThemedText type="body">Team Nova</ThemedText>
          <ThemedText type="small">85.7%</ThemedText>
        </View>
        <View style={[styles.podiumCard, styles.third]}>
          <ThemedText type="subtitle">3</ThemedText>
          <ThemedText type="body">STEM Squad</ThemedText>
          <ThemedText type="small">57.1%</ThemedText>
        </View>
      </View>

      <FlatList
        data={mockLeaderboard.slice(3)}
        keyExtractor={(item) => String(item.rank)}
        renderItem={({ item }) => (
          <View style={styles.rowItem}>
            <View style={styles.rankBadge}>
              <ThemedText type="subtitle">{item.rank}</ThemedText>
            </View>
            <View style={styles.rankText}>
              <ThemedText type="body">{item.name}</ThemedText>
              <ThemedText type="small">Grade {item.grade} • {item.completedActivitiesCount}/7</ThemedText>
            </View>
            <ThemedText type="small">{item.completionPercent}%</ThemedText>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />

      <ThemedView style={styles.stickyStatus}>
        <ThemedText type="subtitle">Your group</ThemedText>
        <ThemedText type="body">Team Pulse • grade 10 • 4 / 7 complete • 57.1%</ThemedText>
      </ThemedView>
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
    backgroundColor: '#1A1A26',
    alignItems: 'center',
  },
  first: {
    transform: [{ scale: 1.05 }],
  },
  second: {
    opacity: 0.95,
  },
  third: {
    opacity: 0.9,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#272732',
    marginRight: Spacing.three,
  },
  rankText: {
    flex: 1,
    gap: Spacing.one,
  },
  divider: {
    height: 1,
    backgroundColor: '#2F2F3D',
  },
  stickyStatus: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#161620',
    marginTop: Spacing.four,
  },
});
