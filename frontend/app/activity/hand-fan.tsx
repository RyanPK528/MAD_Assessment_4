import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, Pressable } from 'react-native';

import { ActivityChoiceChip } from '@/components/activity/ActivityChoiceChip';
import { ActivityLayout, ActivityTab } from '@/components/activity/ActivityLayout';
import { ActivityOverviewPanel } from '@/components/activity/ActivityOverviewPanel';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { ActivitySubmissionPanel } from '@/components/activity/ActivitySubmissionPanel';
import { DesignTrialCard } from '@/components/activity/DesignTrialCard';
import { ReflectionModal } from '@/components/activity/ReflectionModal';
import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { SpacingScale } from '@/constants/theme';
import { useActivityStyles } from '@/hooks/use-activity-styles';
import { useActivitySubmission } from '@/hooks/useActivitySubmission';
import {
  createHandFanController,
  FanDistanceCm,
  FanMaterial,
  HandFanState,
} from '@/services/handFanService';

const DISTANCES: FanDistanceCm[] = [15, 30, 45];

export default function HandFanScreen() {
  const activityStyles = useActivityStyles();
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<HandFanState>({
    phase: 'idle',
    fanIntensity: 0,
    liveIntensity: 0,
    distanceCm: 30,
    material: 'paper',
    stiffnessK: 0.05,
    designs: [],
    bendAngleDeg: 30,
    message: 'Select material and distance, then fan while holding the phone.',
  });
  const [draft, setDraft] = useState({ label: '', prediction: '', notes: '' });
  const [bendInput, setBendInput] = useState('30');
  const [showCamera, setShowCamera] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const controller = useMemo(() => createHandFanController(setState), []);

  const submission = useActivitySubmission({
    activityId: 'hand-fan',
    onSuccess: () => {
      setState((current) => ({
        ...current,
        designs: [],
        message: 'Attempt submitted. Start a new attempt from the Activity tab.',
      }));
      setDraft({ label: '', prediction: '', notes: '' });
      setBendInput('30');
      setRefreshKey((key) => key + 1);
      setActiveTab('submission');
    },
  });

  useEffect(() => {
    controller.setDraftLabel(draft.label);
    controller.setDraftPrediction(draft.prediction);
    controller.setDraftNotes(draft.notes);
  }, [controller, draft]);

  useEffect(() => () => controller.stop(), [controller]);

  const handleOpenCamera = async () => {
    let camStatus = permission;
    if (!camStatus?.granted) {
      camStatus = await requestPermission();
    }
    if (camStatus?.granted) {
      setShowCamera(true);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        setShowCamera(false);
      }
    } catch (error) {
      console.error('Photo capture error:', error);
    }
  };

  const handleSubmit = () => {
    submission.requestSubmit({ designs: state.designs });
  };

  const overviewContent = <ActivityOverviewPanel activityId="hand-fan" />;

  // ─── Camera with angle guide overlay ───
  if (showCamera && permission?.granted) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />

        {/* Simple arc ruler with angle lines */}
        <View style={styles.angleOverlay} pointerEvents="none">
          {/* Vertical baseline (0°) */}
          <View style={styles.baseLine} />

          {/* Angle tick marks at 15°, 30°, 45°, 60°, 90° */}
          {[15, 30, 45, 60, 90].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const len = 140;
            const x = Math.sin(rad) * len;
            const y = Math.cos(rad) * len;
            return (
              <View
                key={angle}
                style={[styles.tickLine, { width: x, height: y, bottom: '30%', left: '50%' }]}
              >
                <View style={styles.tickDash} />
                <ThemedText style={styles.tickLabel}>{angle}°</ThemedText>
              </View>
            );
          })}

          {/* Pivot dot */}
          <View style={styles.pivotDot} />

          <ThemedText style={styles.overlayHint}>
            Align paper with the vertical line
          </ThemedText>
        </View>

        <View style={styles.cameraControls}>
          <AppButton
            label="📸 Capture bend angle"
            onPress={handleTakePhoto}
            fullWidth={false}
          />
          <AppButton
            label="Cancel"
            onPress={() => setShowCamera(false)}
            variant="outline"
            fullWidth={false}
          />
        </View>
      </View>
    );
  }

  const activityContent = (
    <ThemedView style={styles.container}>
      <ActivitySection title="Material">
        <View style={styles.chipRow}>
          {(['paper', 'cardboard'] as FanMaterial[]).map((m) => (
            <ActivityChoiceChip
              key={m}
              label={m}
              selected={state.material === m}
              onPress={() => controller.setMaterial(m)}
            />
          ))}
        </View>
      </ActivitySection>

      <ActivitySection title="Fan distance">
        <View style={styles.chipRow}>
          {DISTANCES.map((d) => (
            <ActivityChoiceChip
              key={d}
              label={`${d} cm`}
              selected={state.distanceCm === d}
              onPress={() => controller.setDistance(d)}
            />
          ))}
        </View>
      </ActivitySection>

      <ActivitySection title="Fan intensity">
        <ThemedText type="title">
          {state.phase === 'fanning' ? state.liveIntensity.toFixed(1) : state.fanIntensity.toFixed(1)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {state.message}
        </ThemedText>
        <View style={styles.buttonRow}>
          {state.phase !== 'fanning' ? (
            <AppButton label="Start fanning" onPress={() => controller.startFanTracking()} />
          ) : (
            <AppButton label="Stop & record" onPress={() => controller.stopFanTracking()} variant="outline" />
          )}
        </View>
      </ActivitySection>

      <ActivitySection title="Design trial">
        <DesignTrialCard
          title={`Design ${state.designs.length + 1} of 3`}
          label={draft.label}
          onLabelChange={(v) => setDraft((d) => ({ ...d, label: v }))}
          prediction={draft.prediction}
          onPredictionChange={(v) => setDraft((d) => ({ ...d, prediction: v }))}
          notes={draft.notes}
          onNotesChange={(v) => setDraft((d) => ({ ...d, notes: v }))}
        >
          <ThemedText type="small" themeColor="textSecondary">
            Bend angle (degrees)
          </ThemedText>
          <TextInput
            value={bendInput}
            onChangeText={(v) => {
              setBendInput(v);
              controller.setBendAngle(Number(v) || 0);
            }}
            keyboardType="number-pad"
            style={activityStyles.input}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Stiffness k = {state.stiffnessK} N/rad • Est. force ≈{' '}
            {(state.stiffnessK * ((Number(bendInput) || 0) * Math.PI) / 180).toFixed(3)} N
          </ThemedText>
        </DesignTrialCard>

        <View style={styles.buttonRow}>
          <AppButton
            label={photoUri ? '📷 Retake photo' : '📷 Capture bend arc'}
            onPress={handleOpenCamera}
            variant="outline"
          />
          {photoUri && (
            <ThemedText type="small" style={{ color: '#4CAF50' }}>
              ✓ Photo captured
            </ThemedText>
          )}
        </View>

        <AppButton
          label="Save design"
          onPress={() => {
            controller.saveDesign();
            setPhotoUri(null);
          }}
          disabled={state.phase === 'fanning'}
        />
      </ActivitySection>

      {state.designs.length > 0 && (
        <ActivitySection title="Results">
          <TrialResultsTable
            rows={state.designs.map((d) => ({
              label: d.label,
              prediction: d.prediction,
              outcome: `${d.bendAngleDeg}° bend, ${d.estimatedForceN} N @ ${d.distanceCm}cm`,
            }))}
          />
        </ActivitySection>
      )}

      <ActivitySection title="Submit">
        <AppButton
          label="Submit attempt"
          onPress={handleSubmit}
          disabled={!submission.canSubmit || state.designs.length === 0}
        />
      </ActivitySection>
    </ThemedView>
  );

  const submissionContent = <ActivitySubmissionPanel activityId="hand-fan" refreshKey={refreshKey} />;

  return (
    <>
      <ActivityLayout
        activityName="Hand Fan Challenge"
        overviewContent={overviewContent}
        activityContent={activityContent}
        submissionContent={submissionContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ReflectionModal
        visible={submission.modalVisible}
        activityName={ACTIVITY_CATALOG['hand-fan'].label}
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
  chipRow: { flexDirection: 'row', gap: SpacingScale.sm, flexWrap: 'wrap' },
  buttonRow: { marginTop: SpacingScale.sm, flexDirection: 'row', alignItems: 'center', gap: SpacingScale.sm },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  angleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  baseLine: {
    position: 'absolute',
    width: 3,
    height: 160,
    backgroundColor: '#fff',
    bottom: '30%',
    alignSelf: 'center',
  },
  tickLine: {
    position: 'absolute',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  tickDash: {
    width: 20,
    height: 3,
    backgroundColor: '#FFD700',
  },
  tickLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pivotDot: {
    position: 'absolute',
    bottom: '30%',
    alignSelf: 'center',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4444',
  },
  overlayHint: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  pivotDot: {
    position: 'absolute',
    bottom: '30%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: '#fff',
  },
  overlayHint: {
    position: 'absolute',
    top: 60,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
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
