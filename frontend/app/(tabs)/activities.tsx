import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const categories = {
  engineering: {
    title: 'Engineering Challenges',
    items: [
      { id: 'parachute-drop', label: 'Parachute Drop Challenge', href: '/activity/parachute-drop' },
      { id: 'sound-pollution', label: 'Sound Pollution Hunter', href: '/activity/sound-pollution' },
      { id: 'hand-fan', label: 'Hand Fan Challenge', href: '/activity/hand-fan' },
      { id: 'earthquake-structure', label: 'Earthquake-Resistant Structure', href: '/activity/earthquake-structure' },
    ],
  },
  health: {
    title: 'Health and Medical Sciences',
    items: [
      { id: 'human-performance', label: 'Human Performance Lab – Stretch Speed & Gracefulness', href: '/activity/human-performance' },
      { id: 'reaction-board', label: 'Reaction Board Challenge', href: '/activity/reaction-board' },
      { id: 'breathing-trainer', label: 'Breathing Pace Trainer', href: '/activity/breathing-trainer' },
    ],
  },
};

export default function ActivitiesScreen() {
  const [activeCategory, setActiveCategory] = useState<'engineering' | 'health'>('engineering');
  const category = categories[activeCategory];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText type="title">Activities</ThemedText>
        <ThemedText type="small" style={styles.headerSubtitle}>
          Filter by the challenge type that fits your team.
        </ThemedText>
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setActiveCategory('engineering')}
          style={({ pressed }) => [
            styles.filterChip,
            activeCategory === 'engineering' && styles.filterChipActive,
            pressed && styles.filterChipPressed,
          ]}>
          <ThemedText type="subtitle" style={activeCategory === 'engineering' ? styles.filterTextActive : styles.filterText}>
            Engineering
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveCategory('health')}
          style={({ pressed }) => [
            styles.filterChip,
            activeCategory === 'health' && styles.filterChipActive,
            pressed && styles.filterChipPressed,
          ]}>
          <ThemedText type="subtitle" style={activeCategory === 'health' ? styles.filterTextActive : styles.filterText}>
            Health & Medical
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle" style={styles.categoryHeading}>{category.title}</ThemedText>
        <View style={styles.cardGrid}>
          {category.items.map((item) => (
            <Link key={item.id} href={item.href} style={styles.activityCard}>
              <ThemedText type="subtitle" style={styles.activityTitle}>{item.label}</ThemedText>
              <ThemedText type="small">Tap to open this experience.</ThemedText>
            </Link>
          ))}
        </View>
      </ScrollView>
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
    gap: Spacing.one,
  },
  headerSubtitle: {
    color: '#8E8E99',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  filterChip: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    backgroundColor: '#23232F',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#3E78FF',
  },
  filterChipPressed: {
    opacity: 0.85,
  },
  filterText: {
    color: '#BBB',
  },
  filterTextActive: {
    color: '#FFF',
  },
  listContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  categoryHeading: {
    marginBottom: Spacing.two,
  },
  cardGrid: {
    gap: Spacing.three,
  },
  activityCard: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#1F1F2A',
    borderWidth: 1,
    borderColor: '#2F2F3D',
  },
  activityTitle: {
    marginBottom: Spacing.one,
  },
});
