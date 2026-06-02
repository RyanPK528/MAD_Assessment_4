import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput } from 'react-native';

import { ActivityLayout } from '@/components/activity/ActivityLayout';
import { createReactionBoardController, ReactionBoardState } from '@/services/reactionBoardService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { saveActivityResult } from '@/services/activityResultService';
import { useActivityStyles } from '@/hooks/use-activity-styles';

export default function ReactionBoardScreen() {
  const activityStyles = useActivityStyles();
  const [state, setState] = useState<ReactionBoardState>({
    stage: 'idle',
    reactionTimeMs: null,
    message: 'Tap to Start Challenge',
  });
  const [selfRating, setSelfRating] = useState('3');
  const [comments, setComments] = useState('');
  const [attempts, setAttempts] = useState<number[]>([]);

  const controller = useMemo(() => createReactionBoardController(setState), []);

  useEffect(() => {
    controller.startChallenge();
    return () => controller.stop();
  }, [controller]);

  const handleTap = () => {
    const reactionTimeMs = controller.handleTap();
    if (reactionTimeMs !== null) {
      setAttempts((current) => [reactionTimeMs, ...current].slice(0, 10));
      void saveActivityResult('reaction-board', { reactionTimeMs }, { reflection: comments });
    }
  };

  const getTapAreaBackgroundColor = () => {
    switch (state.stage) {
      case 'active':
        return '#22C55E';
      case 'tooSoon':
        return '#EF4444';
      default:
        return '#374151';
    }
  };

  const overviewContent = (
    <ThemedView style={activityStyles.section}>
      <ThemedText type="subtitle">Description</ThemedText>
      <ThemedText type="body">Test reflex speed by tapping when the board turns active.</ThemedText>
      <ThemedText type="subtitle">Materials / Equipment</ThemedText>
      <ThemedText type="body">Phone with app, steady hand, quiet workspace.</ThemedText>
      <ThemedText type="subtitle">Instructions</ThemedText>
      <ThemedText type="body">1. Open Activity tab.</ThemedText>
      <ThemedText type="body">2. Wait for active state.</ThemedText>
      <ThemedText type="body">3. Tap immediately and repeat attempts.</ThemedText>
      <ThemedText type="subtitle">Diagram</ThemedText>
      <Image
        source={require('../../assets/instructions/activity6.png')}
        style={styles.instructionImage}
        resizeMode="contain"
      />
    </ThemedView>
  );

  const activityContent = (
    <ThemedView style={styles.container}>
      <ThemedView style={activityStyles.section}>
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
        style={[styles.tapArea, { backgroundColor: getTapAreaBackgroundColor() }]}
      >
        <ThemedText type="title" style={styles.tapText}>{state.message}</ThemedText>
      </Pressable>
    </ThemedView>
  );

  const submissionContent = (
    <ThemedView style={activityStyles.section}>
      <ThemedText type="subtitle">Submitted attempts</ThemedText>
      {attempts.length === 0 ? (
        <ThemedText type="small">No attempts recorded.</ThemedText>
      ) : (
        attempts.map((attempt, idx) => (
          <ThemedText key={idx} type="small">Attempt {idx + 1}: {attempt} ms</ThemedText>
        ))
      )}
      <ThemedText type="subtitle" style={{ marginTop: Spacing.two }}>Theory behind activity</ThemedText>
      <ThemedText type="body">Reaction time depends on sensory processing speed and neuromuscular response.</ThemedText>
      <ThemedText type="subtitle" style={{ marginTop: Spacing.two }}>Self-rating (1-5)</ThemedText>
      <TextInput value={selfRating} onChangeText={setSelfRating} keyboardType="number-pad" style={activityStyles.input} />
      <ThemedText type="subtitle" style={{ marginTop: Spacing.two }}>Comments</ThemedText>
      <TextInput value={comments} onChangeText={setComments} multiline style={[activityStyles.input, activityStyles.multiline]} />
    </ThemedView>
  );

  return (
    <ActivityLayout
      activityName="Reaction Board Challenge"
      overviewContent={overviewContent}
      activityContent={activityContent}
      submissionContent={submissionContent}
    />
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  instructionImage: {
    width: '100%',
    height: 200,
    marginVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  tapArea: {
    minHeight: 200,
    marginTop: Spacing.four,
    borderRadius: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapText: { color: '#FFFFFF', textAlign: 'center' },
});
