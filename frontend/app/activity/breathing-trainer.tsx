import { useEffect, useMemo, useState } from 'react';
import { Button, Image, StyleSheet, View, TextInput } from 'react-native';

import { createBreathingTrainerController, BreathingTrainerState } from '@/services/breathingTrainerService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ActivityLayout } from '@/components/activity/ActivityLayout';
import { saveActivityResult } from '@/services/activityResultService';
import { useActivityStyles } from '@/hooks/use-activity-styles';

export default function BreathingTrainerScreen() {
  const activityStyles = useActivityStyles();
  const [state, setState] = useState<BreathingTrainerState>({
    phase: 'Resting',
    secondsElapsed: 0,
    breathsPerMinute: 0,
    breathCount: 0,
    message: 'Preparing the breathing trainer.',
    isActive: false,
  });
  const [selfRating, setSelfRating] = useState('3');
  const [comments, setComments] = useState('');
  const [attempts, setAttempts] = useState<number[]>([]);

  const controller = useMemo(() => createBreathingTrainerController(setState), []);

  useEffect(() => {
    controller.start();
    return () => controller.stop();
  }, [controller]);

  const handleStop = () => {
    controller.stop();
    setAttempts((current) => [state.breathsPerMinute, ...current].slice(0, 10));
    void saveActivityResult('breathing-trainer', { breathsPerMinute: state.breathsPerMinute, breathCount: state.breathCount }, { reflection: comments });
  };

  const overviewContent = (
    <ThemedView style={activityStyles.section}>
      <ThemedText type="subtitle">Description</ThemedText>
      <ThemedText type="body">Practice paced breathing and monitor breathing rhythm consistency.</ThemedText>
      <ThemedText type="subtitle">Materials / Equipment</ThemedText>
      <ThemedText type="body">Phone with app and a quiet area.</ThemedText>
      <ThemedText type="subtitle">Instructions</ThemedText>
      <ThemedText type="body">1. Start session.</ThemedText>
      <ThemedText type="body">2. Follow inhale/exhale cues.</ThemedText>
      <ThemedText type="body">3. Stop and submit attempt.</ThemedText>
      <ThemedText type="subtitle">Diagram</ThemedText>
      <Image
        source={require('../../assets/instructions/activity7.png')}
        style={styles.instructionImage}
        resizeMode="contain"
      />
    </ThemedView>
  );

  const activityContent = (
    <ThemedView style={styles.container}>
      <ThemedView style={activityStyles.section}>
        <ThemedText type="subtitle">Phase</ThemedText>
        <ThemedText type="body">{state.phase}</ThemedText>
        <ThemedText type="body">Time elapsed: {state.secondsElapsed}s</ThemedText>
        <ThemedText type="body">Breaths per minute: {state.breathsPerMinute}</ThemedText>
        <ThemedText type="small">{state.message}</ThemedText>
      </ThemedView>
      <View style={styles.buttonRow}>
        <Button title="Restart Session" onPress={() => controller.start()} />
        <Button title="Stop" onPress={handleStop} />
      </View>
    </ThemedView>
  );

  const submissionContent = (
    <ThemedView style={activityStyles.section}>
      <ThemedText type="subtitle">Submitted attempts</ThemedText>
      {attempts.length === 0 ? <ThemedText type="small">No attempts submitted yet.</ThemedText> : attempts.map((attempt, idx) => <ThemedText key={idx} type="small">Attempt {idx + 1}: {attempt} BPM</ThemedText>)}
      <ThemedText type="subtitle" style={{ marginTop: Spacing.two }}>Theory behind activity</ThemedText>
      <ThemedText type="body">Controlled breathing supports autonomic regulation and heart-rate variability.</ThemedText>
      <ThemedText type="subtitle" style={{ marginTop: Spacing.two }}>Self-rating (1-5)</ThemedText>
      <TextInput value={selfRating} onChangeText={setSelfRating} keyboardType="number-pad" style={activityStyles.input} />
      <ThemedText type="subtitle" style={{ marginTop: Spacing.two }}>Comments</ThemedText>
      <TextInput value={comments} onChangeText={setComments} multiline style={[activityStyles.input, activityStyles.multiline]} />
    </ThemedView>
  );

  return (
    <ActivityLayout activityName="Breathing Pace Trainer" overviewContent={overviewContent} activityContent={activityContent} submissionContent={submissionContent} />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  instructionImage: {
    width: '100%',
    height: 200,
    marginVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  buttonRow: {
    width: '100%',
    gap: Spacing.three,
  },
});
