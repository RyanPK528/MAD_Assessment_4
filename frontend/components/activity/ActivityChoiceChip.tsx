import { Pressable } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useActivityStyles } from '@/hooks/use-activity-styles';
import { useTheme } from '@/hooks/use-theme';

interface ActivityChoiceChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function capitalizeLabel(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function ActivityChoiceChip({ label, selected, onPress }: ActivityChoiceChipProps) {
  const theme = useTheme();
  const activityStyles = useActivityStyles();

  return (
    <Pressable
      onPress={onPress}
      style={[activityStyles.chip, selected && activityStyles.chipActive]}>
      <ThemedText
        type="smallBold"
        style={{
          color: selected ? theme.onAccent : theme.textPrimary,
          textAlign: 'center',
        }}>
        {capitalizeLabel(label)}
      </ThemedText>
    </Pressable>
  );
}
