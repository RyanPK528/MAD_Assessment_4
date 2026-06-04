import { View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';

interface StatCardProps {
  label: string;
  value: string | number;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <AppCard style={{ flex: 1, minWidth: '45%' }}>
      <ThemedText type="captionBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="stat" style={{ marginTop: SpacingScale.xxs }}>
        {value}
      </ThemedText>
    </AppCard>
  );
}
