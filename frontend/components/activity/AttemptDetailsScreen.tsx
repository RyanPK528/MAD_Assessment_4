import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivitySection } from '@/components/activity/ActivitySection';
import { AttemptReflectionSection } from '@/components/activity/attempt-details/AttemptReflectionSection';
import { getAttemptResultsRenderer } from '@/components/activity/attempt-details/attemptResultRenderers';
import { AppIcon } from '@/components/ui/app-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { ActivityId } from '@/constants/activities';
import { Layout, Radii, SpacingScale } from '@/constants/theme';
import { formatAttemptDateTime } from '@/services/activityAttemptUtils';
import { ActivityAttemptRecord } from '@/types/activityAttempt';
import { useTheme } from '@/hooks/use-theme';

interface AttemptDetailsScreenProps {
  attempt: ActivityAttemptRecord | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AttemptDetailsScreen({ attempt, loading, error, onRetry }: AttemptDetailsScreenProps) {
  const theme = useTheme();
  const router = useRouter();

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </ThemedView>
    );
  }

  if (error || !attempt) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="body">{error ?? 'Attempt not found.'}</ThemedText>
        <Pressable onPress={onRetry}>
          <ThemedText type="link">Retry</ThemedText>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <ThemedText type="link">Go back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const activityLabel = ACTIVITY_CATALOG[attempt.activityId as ActivityId]?.label ?? attempt.activityId;
  const ResultsRenderer = getAttemptResultsRenderer(attempt.activityId as ActivityId);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.background }}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.backgroundSelected }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <AppIcon name="chevron.left" tintColor={theme.textPrimary} size={22} />
          </Pressable>
          <ThemedText type="cardTitle" style={styles.headerTitle} numberOfLines={1}>
            Attempt Details
          </ThemedText>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <ActivitySection title="Attempt Information">
          <ThemedText type="body">Activity: {activityLabel}</ThemedText>
          <ThemedText type="body">Attempt: {attempt.attemptNumber}</ThemedText>
          <ThemedText type="body">Submitted: {formatAttemptDateTime(attempt.completedAt)}</ThemedText>
          {attempt.latitude != null && attempt.longitude != null && (
            <Pressable
              onPress={() => {
                const url = `https://www.google.com/maps?q=${attempt.latitude},${attempt.longitude}`;
                void import('expo-linking').then(({ openURL }) => openURL(url));
              }}
              accessibilityRole="link"
              accessibilityLabel="Open location in Google Maps"
              style={[styles.mapContainer, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={styles.mapContent}>
                <View style={styles.mapPinCircle}>
                  <ThemedText style={styles.mapPinEmoji}>📍</ThemedText>
                </View>
                <View style={styles.mapTextGroup}>
                  <ThemedText type="captionBold">Location Tagged</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {attempt.latitude!.toFixed(5)}, {attempt.longitude!.toFixed(5)}
                  </ThemedText>
                </View>
                <ThemedText type="caption" themeColor="accent">
                  View ›
                </ThemedText>
              </View>
            </Pressable>
          )}
        </ActivitySection>

        <ResultsRenderer attempt={attempt} />
        <AttemptReflectionSection attempt={attempt} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SpacingScale.sm,
    padding: Layout.screenPadding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: SpacingScale.sm,
    gap: SpacingScale.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: Layout.touchTargetMin,
    height: Layout.touchTargetMin,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: SpacingScale.md,
    paddingBottom: SpacingScale.huge,
    gap: SpacingScale.xs,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SpacingScale.xxs,
  },
  mapContainer: {
    borderRadius: Radii.md,
    borderWidth: 1,
    marginTop: SpacingScale.xs,
    overflow: 'hidden',
  },
  mapContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SpacingScale.sm,
    gap: SpacingScale.sm,
  },
  mapPinCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(234, 67, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinEmoji: {
    fontSize: 20,
  },
  mapTextGroup: {
    flex: 1,
    gap: 2,
  },
});
