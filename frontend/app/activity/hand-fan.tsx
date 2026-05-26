import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function HandFanScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Hand Fan Challenge
      </ThemedText>
      <ThemedText type="body">
        This is a template frame for the hand fan design challenge.
      </ThemedText>
      <ThemedText type="small">
        Integrate temperature sensors and rotation tracking in the next implementation phase.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    marginBottom: Spacing.two,
  },
});
