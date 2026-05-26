import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SoundPollutionScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Sound Pollution Hunter
      </ThemedText>
      <ThemedText type="body">
        This placeholder opens the architecture for sound pollution detection with mock UI fields.
      </ThemedText>
      <ThemedText type="small">
        Replace this with microphone permission flows and real-time decibel scoring.
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
