import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radii, SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MAX_DISPLAY_SAMPLES = 48;
const CHART_HEIGHT = 120;

interface MovementSparklineProps {
  values: number[];
}

export function MovementSparkline({ values }: MovementSparklineProps) {
  const theme = useTheme();

  if (values.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.placeholder}>
          Movement monitor will appear during recording.
        </ThemedText>
      </View>
    );
  }

  const displayValues =
    values.length > MAX_DISPLAY_SAMPLES ? values.slice(-MAX_DISPLAY_SAMPLES) : values;
  const max = Math.max(...displayValues, 0.01);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
      <View style={styles.chartRow}>
        {displayValues.map((value, index) => {
          const height = Math.max(4, (value / max) * CHART_HEIGHT);
          return (
            <View
              key={`bar-${index}`}
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: theme.accent,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 160,
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: SpacingScale.sm,
    paddingVertical: SpacingScale.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  placeholder: {
    textAlign: 'center',
    width: '100%',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: CHART_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  bar: {
    flex: 1,
    borderRadius: Radii.sm,
    minWidth: 0,
    maxWidth: 8,
  },
});
