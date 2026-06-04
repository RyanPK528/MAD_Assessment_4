import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={{ paddingVertical: SpacingScale.xxl, alignItems: 'center', gap: SpacingScale.xs }}>
      <ThemedText type="cardTitle" themeColor="textSecondary">
        {title}
      </ThemedText>
      {message ? (
        <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}
