import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ActivityChoiceChip } from '@/components/activity/ActivityChoiceChip';
import { ActivityLayout, ActivityTab } from '@/components/activity/ActivityLayout';
import { ActivityOverviewPanel } from '@/components/activity/ActivityOverviewPanel';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { ActivitySubmissionPanel } from '@/components/activity/ActivitySubmissionPanel';
import { ReflectionModal } from '@/components/activity/ReflectionModal';
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
  createSoundPollutionController,
  getRiskLabel,
  SoundPollutionState,
  SoundPrediction,
} from '@/services/soundPollutionService';

const DEFAULT_ACTIONS = ['Drop book on table', 'Talking', 'Stamp feet'];

export default function SoundPollutionScreen() {
  const theme = useTheme();
  const activityStyles = useActivityStyles();
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<SoundPollutionState>({
    permissionsGranted: false,
    isMetering: false,
    currentDb: 0,
    peakDb: 0,
    actions: [],
    location: null,
    message: 'Grant microphone and location permissions to begin.',
  });
  const [actionLabel, setActionLabel] = useState(DEFAULT_ACTIONS[0]);
  const [prediction, setPrediction] = useState<SoundPrediction>('louder');

  const controller = useMemo(() => createSoundPollutionController(setState), []);

  const submission = useActivitySubmission({
    activityId: 'sound-pollution',
    onSuccess: () => {
      setState((current) => ({
        ...current,
        actions: [],
        message: 'Attempt submitted. Log new actions for your next attempt.',
      }));
      setRefreshKey((key) => key + 1);
      setActiveTab('submission');
    },
  });

  useEffect(() => {
    void controller.requestPermissions();
    return () => {
      void controller.stop();
    };
  }, [controller]);

  const riskLevel = state.currentDb > 0 ? (state.peakDb >= state.currentDb ? state.peakDb : state.currentDb) : 0;
  const gaugeColor =
    riskLevel >= 100 ? theme.danger : riskLevel >= 85 ? '#F59E0B' : riskLevel >= 60 ? theme.accent : theme.success;

  const handleSubmit = () => {
    submission.requestSubmit(
      {
        actions: state.actions,
        zones: state.actions.map((a) => ({
          label: a.label,
          lat: a.latitude,
          lng: a.longitude,
          db: a.measuredDb,
        })),
      },
      { location: state.location },
    );
  };

  const overviewContent = <ActivityOverviewPanel activityId="sound-pollution" />;

  const activityContent = (
    <ThemedView style={styles.container}>
      {!state.permissionsGranted && (
        <ActivitySection title="Permissions">
          <AppButton label="Grant permissions" onPress={() => controller.requestPermissions()} />
        </ActivitySection>
      )}

      <ActivitySection title="Live sound level">
        <ThemedText type="title" style={{ color: gaugeColor, fontSize: 48 }}>
          {state.isMetering ? state.currentDb : '—'} dB
        </ThemedText>
        <ThemedText type="body">Peak: {state.peakDb} dB</ThemedText>
        {state.location && (
          <ThemedText type="small" themeColor="textSecondary">
            GPS: {state.location.latitude.toFixed(4)}, {state.location.longitude.toFixed(4)}
          </ThemedText>
        )}
        <ThemedText type="small" themeColor="textSecondary">
          {state.message}
        </ThemedText>
        <View style={styles.buttonRow}>
          {!state.isMetering ? (
            <AppButton
              label="Start metering"
              onPress={() => controller.startMetering()}
              disabled={!state.permissionsGranted}
            />
          ) : (
            <AppButton label="Stop metering" onPress={() => controller.stopMetering()} variant="outline" />
          )}
        </View>
      </ActivitySection>

      <ActivitySection title="Log action">
        <View style={styles.chipRow}>
          {DEFAULT_ACTIONS.map((a) => (
            <ActivityChoiceChip
              key={a}
              label={a}
              selected={actionLabel === a}
              onPress={() => setActionLabel(a)}
            />
          ))}
        </View>
        <TextInput
          value={actionLabel}
          onChangeText={setActionLabel}
          placeholder="Action label"
          placeholderTextColor={theme.textSecondary}
          style={activityStyles.input}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Prediction vs previous
        </ThemedText>
        <View style={styles.chipRow}>
          {(['louder', 'softer', 'same'] as SoundPrediction[]).map((p) => (
            <ActivityChoiceChip
              key={p}
              label={p}
              selected={prediction === p}
              onPress={() => setPrediction(p)}
            />
          ))}
        </View>
        <AppButton
          label="Log this action"
          onPress={() => controller.logAction(actionLabel, prediction)}
          disabled={state.actions.length >= 10}
        />
      </ActivitySection>

      {state.actions.length > 0 && (
        <>
          <ActivitySection title="Recorded actions">
            <TrialResultsTable
              predictionHeader="Predicted"
              outcomeHeader="Measured (dB)"
              rows={state.actions.map((a) => ({
                label: a.label,
                prediction: a.prediction,
                outcome: `${a.measuredDb} dB — ${getRiskLabel(a.riskLevel)}`,
              }))}
            />
          </ActivitySection>
          <ActivitySection title="Zone map">
            {state.actions.map((a, i) => (
              <ThemedText key={i} type="small" themeColor="textSecondary">
                {a.label}: {a.measuredDb} dB @ {a.latitude?.toFixed(3) ?? '?'}, {a.longitude?.toFixed(3) ?? '?'}
              </ThemedText>
            ))}
          </ActivitySection>
        </>
      )}

      <ActivitySection title="Submit">
        <AppButton
          label="Submit attempt"
          onPress={handleSubmit}
          disabled={!submission.canSubmit || state.actions.length === 0}
        />
      </ActivitySection>
    </ThemedView>
  );

  const submissionContent = (
    <ActivitySubmissionPanel activityId="sound-pollution" showSoundTable refreshKey={refreshKey} />
  );

  return (
    <>
      <ActivityLayout
        activityName="Sound Pollution Hunter"
        overviewContent={overviewContent}
        activityContent={activityContent}
        submissionContent={submissionContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ReflectionModal
        visible={submission.modalVisible}
        activityName={ACTIVITY_CATALOG['sound-pollution'].label}
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
  buttonRow: { marginTop: SpacingScale.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SpacingScale.sm },
});
