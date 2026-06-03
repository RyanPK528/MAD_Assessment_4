import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { ActivitySectionHeading } from '@/components/activity/ActivitySectionHeading';
import { useActivityStyles } from '@/hooks/use-activity-styles';

interface ActivitySectionProps {
  title: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ActivitySection({ title, children, style }: ActivitySectionProps) {
  const activityStyles = useActivityStyles();

  return (
    <View style={[activityStyles.section, style]}>
      <ActivitySectionHeading title={title} />
      {children}
    </View>
  );
}
