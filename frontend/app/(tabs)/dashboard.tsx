import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function DashboardScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        STEMM Lab Dashboard
      </ThemedText>
      <ThemedView style={styles.metricCard}>
        <ThemedText type="subtitle">Group status</ThemedText>
        <ThemedText type="body">Grade 10 • Group Alpha • 4 / 7 challenges completed</ThemedText>
      </ThemedView>
      <ThemedView style={styles.metricCard}>
        <ThemedText type="subtitle">Current session</ThemedText>
        <ThemedText type="body">Human Performance Lab ready. Reaction Board and Breathing Trainer available.</ThemedText>
      </ThemedView>
      <View style={styles.linkRow}>
        <Link href="/activities" style={styles.linkButton}>
          <ThemedText type="button">Open Activities</ThemedText>
        </Link>
        <Link href="/leaderboard" style={styles.linkButtonSecondary}>
          <ThemedText type="button">View Leaderboard</ThemedText>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  title: {
    marginBottom: Spacing.two,
  },
  metricCard: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#161620',
  },
  linkRow: {
    width: '100%',
    gap: Spacing.three,
  },
  linkButton: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#3E78FF',
    alignItems: 'center',
  },
  linkButtonSecondary: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#24243B',
    alignItems: 'center',
  },
});
