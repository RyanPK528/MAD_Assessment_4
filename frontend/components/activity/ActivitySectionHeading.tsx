import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ActivitySectionHeadingProps {
  title: string;
}

export function ActivitySectionHeading({ title }: ActivitySectionHeadingProps) {
  const theme = useTheme();

  return (
    <View style={styles.headingContainer}>
      <ThemedText type="subtitle" style={styles.heading}>
        {title}
      </ThemedText>
      <View style={[styles.underline, { backgroundColor: theme.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  headingContainer: {
    gap: SpacingScale.xxs,
    marginBottom: SpacingScale.xxs,
  },
  heading: {
    marginBottom: 0,
  },
  underline: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    opacity: 0.75,
  },
});
