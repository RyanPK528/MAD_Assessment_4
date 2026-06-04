import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { CategoryBadge } from '@/components/ui/category-badge';
import { ThemedText } from '@/components/themed-text';
import { ActivityCatalogEntry } from '@/constants/activityCatalog';
import { Layout, Radii, SpacingScale, getShadowStyle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Total card height — taller cards show more of each activity image. */
const CARD_HEIGHT = 300;
/** Image area height (~62% of card). */
const IMAGE_HEIGHT = 186;
const CARD_RADIUS = Radii.xl;

interface ActivityCardProps {
  activity: ActivityCatalogEntry;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(activity.href)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${activity.label}`}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          opacity: pressed ? 0.92 : 1,
          ...getShadowStyle('card', theme.shadow),
        },
      ]}
    >
      <View style={styles.imageSection}>
        <Image
          source={activity.cardImage}
          style={styles.coverImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={styles.imageOverlay} />
        <View style={styles.badgeContainer}>
          <CategoryBadge category={activity.category} />
        </View>
      </View>

      <View style={[styles.contentSection, { backgroundColor: theme.surface }]}>
        <ThemedText type="cardTitle" numberOfLines={2} ellipsizeMode="tail">
          {activity.label}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2} ellipsizeMode="tail">
          {activity.descriptionShort}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageSection: {
    height: IMAGE_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  coverImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  badgeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SpacingScale.sm,
    zIndex: 1,
  },
  contentSection: {
    height: CARD_HEIGHT - IMAGE_HEIGHT,
    paddingHorizontal: Layout.cardPadding,
    paddingVertical: SpacingScale.sm,
    gap: SpacingScale.xxs,
    justifyContent: 'center',
  },
});

export { CARD_HEIGHT };
