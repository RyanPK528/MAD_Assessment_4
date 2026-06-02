import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, View, Image, TextInput } from 'react-native';

import { createMotionLabController, MotionLabState, SensorReading } from '@/services/motionLabService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { ActivityLayout } from '@/components/activity/ActivityLayout';
import { saveActivityResult } from '@/services/activityResultService';
import { useActivityStyles } from '@/hooks/use-activity-styles';

interface HumanPerformanceLabResult {
  finalSmoothnessScore: number;
  finalBreachCount: number;
  elapsedRecordingTime: number;
  recordedSensorData: SensorReading[];
}

export default function HumanPerformanceScreen() {
  const [motionState, setMotionState] = useState<MotionLabState>({
    acceleration: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    smoothnessScore: 100,
    breachCount: 0,
    isBreachActive: false,
    lastUpdateAt: 0,
    isRecording: false,
    recordedSensorData: [],
    elapsedRecordingTime: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('Ready to start recording.');
  const [selfRating, setSelfRating] = useState('3');
  const [comments, setComments] = useState('');
  const [submittedAttempts, setSubmittedAttempts] = useState<HumanPerformanceLabResult[]>([]);
  const activityStyles = useActivityStyles();

  const controller = useMemo(() => createMotionLabController(setMotionState), []);

  useEffect(() => {
    controller.start(); // Start sensor listeners in idle mode
    return () => controller.stop();
  }, [controller]);

  const handleStartStopRecording = () => {
    if (motionState.isRecording) {
      controller.stopRecording();
      setMessage('Recording stopped. Review data or submit.');
    } else {
      controller.startRecording();
      setMessage('Recording in progress...');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result: HumanPerformanceLabResult = {
        finalSmoothnessScore: motionState.smoothnessScore,
        finalBreachCount: motionState.breachCount,
        elapsedRecordingTime: motionState.elapsedRecordingTime,
        recordedSensorData: motionState.recordedSensorData,
      };
      await saveActivityResult('human-performance-lab', result);
      setMessage('Results saved successfully!');
      setSubmittedAttempts((current) => [result, ...current].slice(0, 5));
      controller.resetState(); // Reset state for a new attempt
    } catch (error) {
      console.error('Failed to save activity result:', error);
      setMessage('Failed to save results. Saved offline.');
    } finally {
      setSubmitting(false);
    }
  };

  const overviewContent = (
    <ThemedView style={activityStyles.section}>
      <ThemedText type="subtitle">Description</ThemedText>
      <ThemedText type="body">
        Activity 5: Human Performance Lab – Stretch Speed & Gracefulness. Students investigate how the human body moves by measuring speed, smoothness, and coordination during controlled stretching activities.
      </ThemedText>

      <ThemedText type="subtitle" style={styles.sectionTitle}>Materials/Equipment</ThemedText>
      <ThemedText type="body">• Mobile phone with STEMM Lab app</ThemedText>
      <ThemedText type="body">• Open space to move safely</ThemedText>

      <ThemedText type="subtitle" style={styles.sectionTitle}>Step-by-Step Instructions</ThemedText>
      <ThemedText type="body">1. Hold the phone firmly in one hand. Activate the App vibration sensor.</ThemedText>
      <ThemedText type="body">2. Perform guided movement slowly as shown below. Record the vibration.</ThemedText>
      <ThemedText type="body">3. Repeat the activity with vibration feedback enabled.</ThemedText>
      <ThemedText type="body">4. Review speed, smoothness, and range-of-motion data.</ThemedText>
      <ThemedText type="body">5. Upload results and reflect as a group.</ThemedText>
      <ThemedText type="subtitle">Diagram</ThemedText>
      <Image
        source={require('../../assets/instructions/activity5.png')}
        style={styles.instructionImage}
        resizeMode="contain"
      />
    </ThemedView>
  );

  const activityContent = (
    <ThemedView style={activityStyles.section}>
      <ThemedText type="subtitle">Live Sensor Data</ThemedText>
      <ThemedText type="body">Score: {motionState.smoothnessScore.toFixed(0)} / 100</ThemedText>
      <ThemedText type="body">Breaches: {motionState.breachCount}</ThemedText>
      <ThemedText type="small">
        Accelerometer: x {motionState.acceleration.x.toFixed(2)} y {motionState.acceleration.y.toFixed(2)} z {motionState.acceleration.z.toFixed(2)}
      </ThemedText>
      <ThemedText type="small">
        Gyroscope: x {motionState.rotation.x.toFixed(2)} y {motionState.rotation.y.toFixed(2)} z {motionState.rotation.z.toFixed(2)}
      </ThemedText>
      <ThemedText type="body" style={styles.timerText}>
        Elapsed Recording Time: {motionState.elapsedRecordingTime.toFixed(1)}s
      </ThemedText>
      <ThemedText type="small" style={{ marginTop: Spacing.two }}>{message}</ThemedText>

      <View style={styles.buttonRow}>
        <Button
          title={motionState.isRecording ? 'Stop Recording' : 'Start Recording'}
          onPress={handleStartStopRecording}
        />
        <Button
          title={submitting ? 'Submitting...' : 'Submit Results'}
          onPress={handleSubmit}
          disabled={submitting || motionState.isRecording || motionState.recordedSensorData.length === 0}
        />
      </View>
    </ThemedView>
  );

  const submissionContent = (
    <ThemedView style={activityStyles.section}>
      <ThemedText type="subtitle">Submitted attempts</ThemedText>
      {submittedAttempts.length === 0 ? (
        <ThemedText type="small">No submissions yet. Complete an attempt and submit from the Activity tab.</ThemedText>
      ) : (
        submittedAttempts.map((attempt, idx) => (
          <ThemedText key={idx} type="small">
            Attempt {idx + 1}: score {attempt.finalSmoothnessScore.toFixed(0)}, breaches {attempt.finalBreachCount}, time {attempt.elapsedRecordingTime.toFixed(1)}s
          </ThemedText>
        ))
      )}

      <ThemedText type="subtitle" style={styles.sectionTitle}>Theory behind activity</ThemedText>
      <ThemedText type="body">
        Smooth and controlled movement indicates better neuromuscular coordination. Accelerometer and gyroscope spikes indicate jerky movement and control loss.
      </ThemedText>

      <ThemedText type="subtitle" style={styles.sectionTitle}>Self-rating (1-5)</ThemedText>
      <TextInput value={selfRating} onChangeText={setSelfRating} keyboardType="number-pad" style={activityStyles.input} />
      <ThemedText type="subtitle" style={styles.sectionTitle}>Comments</ThemedText>
      <TextInput value={comments} onChangeText={setComments} multiline style={[activityStyles.input, activityStyles.multiline]} />
    </ThemedView>
  );

  return (
    <ActivityLayout
      activityName="Human Performance Lab"
      overviewContent={overviewContent}
      activityContent={activityContent}
      submissionContent={submissionContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.three,
  },
  contentCard: {
    width: '100%',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    marginTop: Spacing.three,
  },
  instructionImage: {
    width: '100%',
    height: 200,
    marginVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  timerText: {
    marginTop: Spacing.two,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.four,
    width: '100%',
    gap: Spacing.two,
  },
});
