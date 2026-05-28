import { Link } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const activities = [
  { id: 'human-performance', label: 'Human Performance Lab', href: '/activity/human-performance' },
  { id: 'reaction-board', label: 'Reaction Board Challenge', href: '/activity/reaction-board' },
  { id: 'breathing-trainer', label: 'Breathing Pace Trainer', href: '/activity/breathing-trainer' },
  { id: 'parachute-drop', label: 'Parachute Drop Challenge', href: '/activity/parachute-drop' },
  { id: 'sound-pollution', label: 'Sound Pollution Hunter', href: '/activity/sound-pollution' },
  { id: 'hand-fan', label: 'Hand Fan Challenge', href: '/activity/hand-fan' },
  { id: 'earthquake-structure', label: 'Earthquake-Resistant Structure', href: '/activity/earthquake-structure' },
] as const;

export default function ActivityIndexScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Lab Challenges
      </ThemedText>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link href={item.href} style={styles.card}>
            <ThemedText type="body">{item.label}</ThemedText>
          </Link>
        )}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
      />
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
  card: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#1B1B28',
  },
  divider: {
    height: 1,
    backgroundColor: '#2F2F3E',
    marginVertical: Spacing.two,
  },
});
