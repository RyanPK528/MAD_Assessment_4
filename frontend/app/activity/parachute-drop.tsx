import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function ParachuteDropScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Parachute Drop Challenge
      </ThemedText>
      <ThemedText type="body">
        This screen is reserved as a clean engineering placeholder for the parachute drop challenge.
      </ThemedText>
      <ThemedText type="small">
        Use this component to hook in drop simulation data and dynamic altitude/payload metrics.
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
