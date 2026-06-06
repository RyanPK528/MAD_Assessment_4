import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ActivityChoiceChip } from '@/components/activity/ActivityChoiceChip';
import { ActivityLayout, ActivityTab } from '@/components/activity/ActivityLayout';
import { ActivityOverviewPanel } from '@/components/activity/ActivityOverviewPanel';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { ActivitySectionHeading } from '@/components/activity/ActivitySectionHeading';
import { ActivitySubmissionPanel } from '@/components/activity/ActivitySubmissionPanel';
import { ReflectionModal } from '@/components/activity/ReflectionModal';
import { DesignTrialCard } from '@/components/activity/DesignTrialCard';
import { PhysicsResultPanel } from '@/components/activity/PhysicsResultPanel';
import { SessionTimer } from '@/components/activity/SessionTimer';
import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { SpacingScale } from '@/constants/theme';
import { useActivityStyles } from '@/hooks/use-activity-styles';
import { useActivitySubmission } from '@/hooks/useActivitySubmission';
import { useTheme } from '@/hooks/use-theme';
import {
  createEmptyTrial,
  createParachuteDropController,
  ParachuteDropState,
  SESSION_MAX_SEC,
} from '@/services/parachuteDropService';

export default function ParachuteDropScreen() {
  const theme = useTheme();
  const activityStyles = useActivityStyles();
  const [state, setState] = useState<ParachuteDropState>({
    phase: 'setup',
    dropHeightM: 1.0,
    toyMassKg: 0.2,
    trials: [createEmptyTrial(0), createEmptyTrial(1), createEmptyTrial(2)],
    activeTrialIndex: 0,
    sessionTimerSec: 0,
    sessionRunning: false,
    dropTimerSec: 0,
    dropTimerRunning: false,
    reflection: '',
    message: 'Enter drop height and toy mass, then run up to 3 prototype tests.',
  });
  const [heightInput, setHeightInput] = useState('1.0');
  const [massInput, setMassInput] = useState('0.2');
  const [contactInput, setContactInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const submission = useActivitySubmission({
    activityId: 'parachute-drop',
    onSuccess: () => {
      setState((current) => ({
        ...current,
        phase: 'setup',
        trials: [createEmptyTrial(0), createEmptyTrial(1), createEmptyTrial(2)],
        activeTrialIndex: 0,
        sessionTimerSec: 0,
        sessionRunning: false,
        reflection: '',
        message: 'Attempt submitted. Start a new attempt from the Activity tab.',
      }));
      setRefreshKey((key) => key + 1);
      setActiveTab('submission');
    },
  });

  const controller = useMemo(() => {
    const ctrl = createParachuteDropController(setState);
    return ctrl;
  }, []);

  useEffect(() => () => controller.stop(), [controller]);

  const activeTrial = state.trials[state.activeTrialIndex];

  const handleRecordVideo = async () => {
    let camStatus = permission;
    if (!camStatus?.granted) {
      camStatus = await requestPermission();
    }

    let micStatus = micPermission;
    if (!micStatus?.granted) {
      micStatus = await requestMicPermission();
    }

    if (camStatus?.granted && micStatus?.granted) {
      setShowCamera(true);
    }
  };

  const handleStartRecording = async () => {
    if (!cameraRef.current || isRecording) return;

    try {
      setIsRecording(true);
      console.log('Attempting to start recording...');

      // Start the drop timer simultaneously with recording
      controller.startDropTimer();

      const video = await cameraRef.current.recordAsync({ maxDuration: 30 });

      console.log('Recording finished successfully:', video?.uri);
      if (video?.uri) {
        controller.setVideoUri(video.uri);
      }
    } catch (error) {
      console.error('ACTUAL NATIVE ERROR:', error);
    } finally {
      setIsRecording(false);
      setShowCamera(false);
    }
  };

  const handleStopVideo = () => {
    if (cameraRef.current && isRecording) {
      console.log('Stopping recording...');
      cameraRef.current.stopRecording();
      // Stop the drop timer when video recording stops
      controller.stopDropTimer();
    } else {
      setShowCamera(false);
    }
  };

  const handleSubmit = () => {
    submission.requestSubmit({
      dropHeightM: state.dropHeightM,
      toyMassKg: state.toyMassKg,
      trials: state.trials.map((t) => ({
        ...t,
        // Include videoUri so teachers can review the drop videos
        videoUri: t.videoUri,
      })),
      sessionTimerSec: state.sessionTimerSec,
    });
  };

  if (showCamera && permission?.granted) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} mode="video" facing="back" />

        <View style={styles.cameraControls}>
          <AppButton
            label={isRecording ? 'Recording…' : 'Start recording'}
            onPress={handleStartRecording}
            disabled={isRecording}
            fullWidth={false}
          />
          <AppButton
            label={isRecording ? 'Stop & save' : 'Cancel & close'}
            onPress={handleStopVideo}
            variant="outline"
            fullWidth={false}
          />
        </View>
      </View>
    );
  }

  const overviewContent = <ActivityOverviewPanel activityId="parachute-drop" />;

  const activityContent = (
    <ThemedView style={styles.container}>
      <ActivitySection title="Design session">
        <SessionTimer
          elapsedSec={state.sessionTimerSec}
          maxSec={SESSION_MAX_SEC}
          isRunning={state.sessionRunning}
          onStart={() => controller.startSessionTimer()}
          onStop={() => controller.stopSessionTimer()}
          onReset={() => controller.resetSessionTimer()}
          label="20-minute design session"
        />
      </ActivitySection>

      <ActivitySection title="Setup">
        <ThemedText type="small" themeColor="textSecondary">
          Drop height (m)
        </ThemedText>
        <TextInput
          value={heightInput}
          onChangeText={(v) => {
            setHeightInput(v);
            controller.setDropHeight(Number(v) || 0);
          }}
          keyboardType="decimal-pad"
          style={activityStyles.input}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Toy mass (kg)
        </ThemedText>
        <TextInput
          value={massInput}
          onChangeText={(v) => {
            setMassInput(v);
            controller.setMass(Number(v) || 0);
          }}
          keyboardType="decimal-pad"
          style={activityStyles.input}
        />
        <AppButton label="Begin trials" onPress={() => controller.setPhase('recording')} />
      </ActivitySection>

      {state.phase !== 'setup' && activeTrial && (
        <>
          <ActivitySection title="Prototype trials">
            <View style={styles.trialTabs}>
              {[0, 1, 2].map((i) => (
                <ActivityChoiceChip
                  key={i}
                  label={`Trial ${i + 1}`}
                  selected={state.activeTrialIndex === i}
                  onPress={() => controller.setActiveTrial(i)}
                />
              ))}
            </View>

            <DesignTrialCard
              title={activeTrial.label}
              label={activeTrial.label}
              onLabelChange={(v) => controller.updateActiveTrial({ label: v })}
              prediction={activeTrial.prediction}
              onPredictionChange={(v) => controller.updateActiveTrial({ prediction: v })}
            />

            <ActivitySectionHeading title="Drop timer" />
            <ThemedText type="title">
              {state.dropTimerRunning
                ? state.dropTimerSec.toFixed(3)
                : activeTrial.fallTimeSec?.toFixed(3) ?? '0.000'}{' '}
              s
            </ThemedText>
            <View style={styles.buttonRow}>
              {!state.dropTimerRunning ? (
                <AppButton label="Start drop" onPress={() => controller.startDropTimer()} />
              ) : (
                <AppButton label="Toy hit ground — stop" onPress={() => controller.stopDropTimer()} />
              )}
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              Contact time from slow-motion (s)
            </ThemedText>
            <TextInput
              value={contactInput}
              onChangeText={(v) => {
                setContactInput(v);
                controller.setContactTime(Number(v) || 0);
              }}
              keyboardType="decimal-pad"
              placeholder="e.g. 0.05"
              placeholderTextColor={theme.textSecondary}
              style={activityStyles.input}
            />

            <View style={styles.buttonRow}>
              <AppButton label="Record slow-mo video" onPress={handleRecordVideo} />
              {activeTrial.videoUri && (
                <ThemedText type="small" style={{ color: theme.success }}>
                  Video saved
                </ThemedText>
              )}
            </View>

            <PhysicsResultPanel
              values={{
                impactSpeedMs: activeTrial.impactSpeedMs,
                accelerationMs2: activeTrial.accelerationMs2,
                netForceN: activeTrial.netForceN,
                dragForceN: activeTrial.dragForceN,
                gForce: activeTrial.gForce,
              }}
            />
          </ActivitySection>
        </>
      )}

      {state.trials.some((t) => t.fallTimeSec !== null) && (
        <ActivitySection title="Results summary">
          <TrialResultsTable
            rows={state.trials
              .filter((t) => t.fallTimeSec !== null)
              .map((t) => ({
                label: t.label,
                prediction: t.prediction || '—',
                outcome: `${t.fallTimeSec?.toFixed(3)} s fall${t.gForce !== null ? `, ${t.gForce.toFixed(1)} g` : ''}`,
              }))}
          />
        </ActivitySection>
      )}

      <ActivitySection title="Submit">
        <ThemedText type="small" themeColor="textSecondary">
          {state.message}
        </ThemedText>
        <AppButton
          label="Submit attempt"
          onPress={handleSubmit}
          disabled={!submission.canSubmit || !state.trials.some((t) => t.fallTimeSec !== null)}
        />
      </ActivitySection>
    </ThemedView>
  );

  const submissionContent = (
    <ActivitySubmissionPanel activityId="parachute-drop" refreshKey={refreshKey} />
  );

  return (
    <>
      <ActivityLayout
        activityName="Parachute Drop Challenge"
        overviewContent={overviewContent}
        activityContent={activityContent}
        submissionContent={submissionContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ReflectionModal
        visible={submission.modalVisible}
        activityName={ACTIVITY_CATALOG['parachute-drop'].label}
        submitting={submission.submitting}
        errorMessage={submission.submitError}
        onConfirm={submission.confirmSubmit}
        onCancel={submission.cancelSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: SpacingScale.xs },
  buttonRow: { flexDirection: 'row', gap: SpacingScale.sm, alignItems: 'center', flexWrap: 'wrap' },
  trialTabs: { flexDirection: 'row', gap: SpacingScale.sm, flexWrap: 'wrap' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SpacingScale.md,
    paddingHorizontal: SpacingScale.md,
  },
});
