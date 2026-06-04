import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';
import { useUiStyles } from '@/hooks/use-ui-styles';

interface ProgressBarProps {
  value: number;
  label?: string;
  showPercent?: boolean;
}

export function ProgressBar({ value, label, showPercent = true }: ProgressBarProps) {
  const ui = useUiStyles();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <View style={{ gap: SpacingScale.xs }}>
      {(label || showPercent) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {label ? <ThemedText type="caption">{label}</ThemedText> : <View />}
          {showPercent ? <ThemedText type="captionBold">{clamped}%</ThemedText> : null}
        </View>
      )}
      <View style={ui.progressTrack} accessibilityRole="progressbar">
        <View style={[ui.progressFill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
}
