import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/activity/ActivityCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_LIST } from '@/constants/activityCatalog';
import { ActivityCategoryName } from '@/constants/activities';
import {
  Layout,
  SpacingScale,
  getCategoryBadgeColors,
} from '@/constants/theme';
import { useThemeContext } from '@/components/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { useUiStyles } from '@/hooks/use-ui-styles';

const categories = ['All', 'Engineering', 'Health & Medical'] as const;
type FilterCategory = (typeof categories)[number];

export default function ActivitiesScreen() {
  const theme = useTheme();
  const ui = useUiStyles();
  const { mode } = useThemeContext();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('All');

  const filteredActivities = useMemo(
    () =>
      activeCategory === 'All'
        ? ACTIVITY_LIST
        : ACTIVITY_LIST.filter((item) => item.category === activeCategory),
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
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <ActivityCard activity={item} />}
          ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
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
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SpacingScale.huge,
  },
  cardSeparator: {
    height: SpacingScale.xl,
  },
});
