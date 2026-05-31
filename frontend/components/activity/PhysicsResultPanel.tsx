import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export interface PhysicsValues {
  impactSpeedMs?: number | null;
  accelerationMs2?: number | null;
  netForceN?: number | null;
  dragForceN?: number | null;
  gForce?: number | null;
}

interface PhysicsResultPanelProps {
  values: PhysicsValues;
  gForceRiskLabel?: string;
}

export function getGForceRiskLabel(gForce: number | null | undefined): string {
  if (gForce === null || gForce === undefined) {
    return 'N/A';
  }
  if (gForce <= 5) {
    return '1–5 g: No injury risk';
  }
  if (gForce <= 10) {
    return '5–10 g: Possible bruising';
  }
  if (gForce <= 30) {
    return '10–30 g: Serious injury possible';
  }
  if (gForce <= 50) {
    return '30–50 g: High injury risk';
  }
  return '50+ g: Life-threatening';
}

export function PhysicsResultPanel({ values, gForceRiskLabel }: PhysicsResultPanelProps) {
  const theme = useTheme();
  const risk = gForceRiskLabel ?? getGForceRiskLabel(values.gForce);

  const rows = [
    { label: 'Impact speed', value: values.impactSpeedMs, unit: 'm/s' },
    { label: 'Acceleration', value: values.accelerationMs2, unit: 'm/s²' },
    { label: 'Net force', value: values.netForceN, unit: 'N' },
    { label: 'Drag force', value: values.dragForceN, unit: 'N' },
    { label: 'G-force', value: values.gForce, unit: 'g' },
  ];

  return (
    <View style={[styles.panel, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <ThemedText type="subtitle">Physics results</ThemedText>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {row.label}
          </ThemedText>
          <ThemedText type="body">
            {row.value !== null && row.value !== undefined ? `${row.value.toFixed(2)} ${row.unit}` : '—'}
          </ThemedText>
        </View>
      ))}
      {values.gForce !== null && values.gForce !== undefined && (
        <ThemedText type="small" style={{ color: theme.accent, marginTop: Spacing.two }}>
          Risk: {risk}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});