import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SOUND_LEVEL_REFERENCE } from '@/constants/activityCatalog';
import { Radii, SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SoundLevelTable() {
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, { borderColor: theme.border, backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="captionBold" style={styles.tableTitle}>
        Sound Level Reference
      </ThemedText>

      <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
        <ThemedText type="captionBold" style={[styles.cell, styles.colDb]}>
          Sound Level (dB)
        </ThemedText>
        <ThemedText type="captionBold" style={[styles.cell, styles.colExamples]}>
          Example Sounds
        </ThemedText>
        <ThemedText type="captionBold" style={[styles.cell, styles.colRisk]}>
          Risk to Hearing
        </ThemedText>
      </View>

      {SOUND_LEVEL_REFERENCE.map((row) => (
        <View key={row.range} style={[styles.dataRow, { borderBottomColor: theme.border }]}>
          <ThemedText type="caption" style={[styles.cell, styles.colDb]}>
            {row.range}
          </ThemedText>
          <ThemedText type="caption" style={[styles.cell, styles.colExamples]}>
            {row.examples}
          </ThemedText>
          <ThemedText type="caption" style={[styles.cell, styles.colRisk]}>
            {row.risk}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: SpacingScale.sm,
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: Radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableTitle: {
    paddingHorizontal: SpacingScale.sm,
    paddingTop: SpacingScale.sm,
    paddingBottom: SpacingScale.xs,
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataRow: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flexShrink: 1,
    paddingVertical: SpacingScale.xs,
    paddingHorizontal: SpacingScale.xs,
  },
  colDb: {
    flex: 0.85,
    minWidth: 0,
  },
  colExamples: {
    flex: 1.05,
    minWidth: 0,
  },
  colRisk: {
    flex: 1.25,
    minWidth: 0,
  },
});
