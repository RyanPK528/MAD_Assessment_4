import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { createReactionBoardController, ReactionBoardState } from '@/services/reactionBoardService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function ReactionBoardScreen() {
  const [state, setState] = useState<ReactionBoardState>({
    stage: 'idle',
    reactionTimeMs: null,
    message: 'Tap to Start Challenge',
  });

  const controller = useMemo(() => createReactionBoardController(setState), []);

  useEffect(() => {
    controller.startChallenge();
    return () => controller.stop();
  }, [controller]);

  const handleTap = () => {
    const reactionTime = controller.handleTap();
    // Reaction time is only non-null when successfully completing a challenge
  };

  // Determine tap area background color based on stage
  const getTapAreaBackgroundColor = () => {
    switch (state.stage) {
      case 'active':
        return '#22C55E'; // green
      case 'tooSoon':
        return '#EF4444'; // red
      default:
        return '#374151'; // grey
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Reaction Board Challenge
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Current Stage</ThemedText>
        <ThemedText type="body">{state.stage}</ThemedText>
        <ThemedText type="small">{state.message}</ThemedText>
        {state.reactionTimeMs !== null && state.stage === 'complete' && (
          <ThemedText type="body" style={{ marginTop: Spacing.two }}>
            Reaction time: {state.reactionTimeMs} ms
          </ThemedText>
        )}
      </ThemedView>
      <Pressable
        onPress={handleTap}
        style={[
          styles.tapArea,
          {
            backgroundColor: getTapAreaBackgroundColor(),
          },
        ]}>
        <ThemedText type="title" style={styles.tapText}>
          {state.message}
        </ThemedText>
      </Pressable>
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
    marginBottom: Spacing.three,
  },
  card: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#1E1E2C',
    gap: Spacing.two,
  },
  tapArea: {
    flex: 1,
    marginTop: Spacing.four,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
