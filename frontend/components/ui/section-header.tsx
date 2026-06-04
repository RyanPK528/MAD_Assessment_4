import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: SpacingScale.sm,
        marginBottom: SpacingScale.sm,
      }}
    >
      <View style={{ flex: 1, gap: SpacingScale.xxs }}>
        <ThemedText type="sectionTitle">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {action}
    </View>
  );
}
