import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useMemo, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const activities = [
  { id: 'parachute-drop', label: 'Parachute Drop Challenge', href: '/activity/parachute-drop', category: 'Engineering', order: 1 },
  { id: 'sound-pollution', label: 'Sound Pollution Hunter', href: '/activity/sound-pollution', category: 'Engineering', order: 2 },
  { id: 'hand-fan', label: 'Hand Fan Challenge', href: '/activity/hand-fan', category: 'Engineering', order: 3 },
  { id: 'earthquake-structure', label: 'Earthquake-Resistant Structure', href: '/activity/earthquake-structure', category: 'Engineering', order: 4 },
  { id: 'human-performance', label: 'Human Performance Lab – Stretch Speed & Gracefulness', href: '/activity/human-performance', category: 'Health & Medical', order: 5 },
  { id: 'reaction-board', label: 'Reaction Board Challenge', href: '/activity/reaction-board', category: 'Health & Medical', order: 6 },
  { id: 'breathing-trainer', label: 'Breathing Pace Trainer', href: '/activity/breathing-trainer', category: 'Health & Medical', order: 7 },
] as const;

const categories = ['All', 'Engineering', 'Health & Medical'] as const;

type ActivityCategory = (typeof categories)[number];

const sortedActivities = activities.slice().sort((a, b) => a.order - b.order);

export default function ActivitiesScreen() {
  const theme = useTheme();
  const [activeCategory, setActiveCategory] = useState<ActivityCategory>('All');

  const filteredActivities = useMemo(
    () =>
      activeCategory === 'All'
        ? sortedActivities
        : sortedActivities.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}> 
      <ThemedText type="title" style={[styles.title, { color: theme.textPrimary }]}>Activities</ThemedText>

      <View style={styles.filterRow}>
        {categories.map((category) => {
          const isSelected = category === activeCategory;
          return (
            <Pressable
              key={category}
              onPress={() => setActiveCategory(category)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isSelected ? theme.accent : theme.backgroundElement,
                  borderColor: isSelected ? theme.accent : theme.border,
                },
              ]}
            >
              <ThemedText type="smallBold" style={{ color: isSelected ? theme.backgroundElement : theme.textPrimary }}>
                {category}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link
            href={item.href}
            style={[
              styles.activityCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <ThemedText type="subtitle" style={{ color: theme.textPrimary }}>{item.label}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>{item.category}</ThemedText>
          </Link>
        )}
        ItemSeparatorComponent={() => <View style={[styles.divider, { backgroundColor: theme.border }]} />}
        contentContainerStyle={styles.listContent}
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
    marginBottom: Spacing.four,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  filterButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  activityCard: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.two,
  },
});
