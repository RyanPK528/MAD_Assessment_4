import { useEffect, useMemo, useState } from 'react';
import { Alert, PanResponder, StyleSheet, TextInput, View } from 'react-native';

import { createReactionBoardController, ReactionBoardState, TracePoint } from '@/services/reactionBoardService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function ReactionBoardScreen() {
  const [state, setState] = useState<ReactionBoardState>({
    stage: 'tap',
    reactionTimeMs: null,
    swapDetected: false,
    traceCompletion: 0,
    message: 'Ready to start the reaction board.',
  });

  const controller = useMemo(() => createReactionBoardController(setState), []);

  useEffect(() => {
    controller.startTapStage();
    return () => controller.stop();
  }, [controller]);

  const tapHandler = async () => {
    try {
      const reactionTime = controller.submitTap();
      Alert.alert('Reaction recorded', `Reaction time: ${reactionTime} ms`);
      controller.startSwapDetection();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to submit tap.';
      Alert.alert('Error', message);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => state.stage === 'trace',
    onPanResponderMove: (event, gestureState) => {
      controller.addTracePoint({
        x: gestureState.moveX,
        y: gestureState.moveY,
        timestamp: Date.now(),
      });
    },
    onPanResponderRelease: () => {
      if (state.stage === 'trace') {
        try {
          controller.finalizeTrace();
          Alert.alert('Trace complete', 'Great job tracing the shape.');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Trace did not complete successfully.';
          Alert.alert('Trace update', message);
        }
      }
    },
  });

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Reaction Board Challenge
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Stage</ThemedText>
        <ThemedText type="body">{state.stage}</ThemedText>
        <ThemedText type="small">{state.message}</ThemedText>
        <ThemedText type="body">Reaction time: {state.reactionTimeMs ?? '--'} ms</ThemedText>
        <ThemedText type="body">Trace completion: {state.traceCompletion}%</ThemedText>
      </ThemedView>
      <View style={styles.tapArea} {...panResponder.panHandlers}>
        <ThemedText type="small">{state.stage === 'trace' ? 'Trace here' : 'Tap to complete the active stage'}</ThemedText>
        {state.stage === 'tap' && (
          <TextInput
            onFocus={tapHandler}
            style={styles.hiddenInput}
            placeholder="Tap to react"
            placeholderTextColor="transparent"
          />
        )}
      </View>
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
    borderWidth: 1,
    borderColor: '#34344A',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#11111C',
  },
  hiddenInput: {
    width: '100%',
    height: '100%',
    opacity: 0,
  },
});
