import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function EarthquakeStructureScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Earthquake-Resistant Structure
      </ThemedText>
      <ThemedText type="body">
        This page is a skeleton for the earthquake-resistant structure challenge.
      </ThemedText>
      <ThemedText type="small">
        Use this page for future sensor integration and structural analysis metrics.
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
