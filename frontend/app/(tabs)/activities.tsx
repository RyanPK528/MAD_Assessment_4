import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';

import { CategoryBadge } from '@/components/ui/category-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  ActivityCategoryName,
  Layout,
  Radii,
  SpacingScale,
  getCategoryBadgeColors,
  getShadowStyle,
} from '@/constants/theme';
import { useThemeContext } from '@/components/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { useUiStyles } from '@/hooks/use-ui-styles';

const activities = [
  { id: 'parachute-drop', label: 'Parachute Drop Challenge', href: '/activity/parachute-drop', category: 'Engineering' as ActivityCategoryName, order: 1 },
  { id: 'sound-pollution', label: 'Sound Pollution Hunter', href: '/activity/sound-pollution', category: 'Engineering' as ActivityCategoryName, order: 2 },
  { id: 'hand-fan', label: 'Hand Fan Challenge', href: '/activity/hand-fan', category: 'Engineering' as ActivityCategoryName, order: 3 },
  { id: 'earthquake-structure', label: 'Earthquake-Resistant Structure', href: '/activity/earthquake-structure', category: 'Engineering' as ActivityCategoryName, order: 4 },
  { id: 'human-performance', label: 'Human Performance Lab', href: '/activity/human-performance', category: 'Health & Medical' as ActivityCategoryName, order: 5 },
  { id: 'reaction-board', label: 'Reaction Board Challenge', href: '/activity/reaction-board', category: 'Health & Medical' as ActivityCategoryName, order: 6 },
  { id: 'breathing-trainer', label: 'Breathing Pace Trainer', href: '/activity/breathing-trainer', category: 'Health & Medical' as ActivityCategoryName, order: 7 },
] as const;

const categories = ['All', 'Engineering', 'Health & Medical'] as const;
type FilterCategory = (typeof categories)[number];

const sortedActivities = activities.slice().sort((a, b) => a.order - b.order);

export default function ActivitiesScreen() {
  const theme = useTheme();
  const ui = useUiStyles();
  const { mode } = useThemeContext();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');

  const filteredActivities = useMemo(
    () =>
      activeCategory === 'All'
        ? sortedActivities
        : sortedActivities.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  return (
    <ThemedView style={ui.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ThemedText type="pageTitle" style={styles.title}>
          Activities
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.subtitle}>
          Complete hands-on STEMM challenges with your team
        </ThemedText>

        <View style={styles.filterRow}>
          {categories.map((category) => {
            const isSelected = category === activeCategory;
            const isThemedCategory = category !== 'All';
            const badgeColors = isThemedCategory
              ? getCategoryBadgeColors(category as ActivityCategoryName, mode)
              : null;

            return (
              <Pressable
                key={category}
                onPress={() => setActiveCategory(category)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={[
                  ui.chip,
                  isSelected && !isThemedCategory && ui.chipActive,
                  isSelected && isThemedCategory && badgeColors
                    ? { backgroundColor: badgeColors.background, borderColor: badgeColors.border }
                    : null,
                ]}
              >
                <ThemedText
                  type="captionBold"
                  style={{
                    color: isSelected
                      ? isThemedCategory && badgeColors
                        ? badgeColors.text
                        : theme.onAccent
                      : theme.textPrimary,
                  }}
                >
                  {category}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Link
              href={item.href}
              style={[
                styles.activityCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  ...getShadowStyle('card', theme.shadow),
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <ThemedText type="cardTitle" style={styles.activityLabel}>
                  {item.label}
                </ThemedText>
                <ThemedText type="metadata" themeColor="textSecondary">
                  #{item.order}
                </ThemedText>
              </View>
              <CategoryBadge category={item.category} />
            </Link>
          )}
          ItemSeparatorComponent={() => <View style={{ height: SpacingScale.sm }} />}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: SpacingScale.xl,
  },
  title: {
    marginBottom: SpacingScale.xxs,
  },
  subtitle: {
    marginBottom: SpacingScale.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SpacingScale.xs,
    marginBottom: SpacingScale.md,
  },
  listContent: {
    paddingBottom: SpacingScale.huge,
  },
  activityCard: {
    width: '100%',
    padding: Layout.cardPadding,
    borderRadius: Radii.xl,
    borderWidth: 1,
    gap: SpacingScale.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SpacingScale.sm,
  },
  activityLabel: {
    flex: 1,
  },
});
