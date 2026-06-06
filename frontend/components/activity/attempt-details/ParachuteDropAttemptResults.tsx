import { useState } from 'react';
import { Pressable, View, StyleSheet, Modal } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ActivitySection } from '@/components/activity/ActivitySection';
import { PhysicsResultPanel } from '@/components/activity/PhysicsResultPanel';
import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { SpacingScale, Radii } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

interface TrialData {
  label?: string;
  prediction?: string;
  fallTimeSec?: number | null;
  gForce?: number | null;
  impactSpeedMs?: number | null;
  accelerationMs2?: number | null;
  netForceN?: number | null;
  dragForceN?: number | null;
  videoUri?: string | null;
}

/** Inline video player for a single trial video */
function TrialVideoPlayer({ uri, label }: { uri: string; label: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <View style={videoStyles.playerContainer}>
      <ThemedText type="captionBold" style={{ marginBottom: SpacingScale.xxs }}>{label}</ThemedText>
      <VideoView
        player={player}
        style={videoStyles.videoPlayer}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

export function ParachuteDropAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  const theme = useTheme();
  const data = attempt.data as {
    dropHeightM?: number;
    toyMassKg?: number;
    sessionTimerSec?: number;
    trials?: TrialData[];
  };

  const trials = Array.isArray(data.trials) ? data.trials : [];
  const videosAvailable = trials.some((t) => t.videoUri);

  return (
    <>
      <ActivitySection title="Session">
        <ThemedText type="body">Drop height: {data.dropHeightM ?? '—'} m</ThemedText>
        <ThemedText type="body">Toy mass: {data.toyMassKg ?? '—'} kg</ThemedText>
        <ThemedText type="body">Session time: {data.sessionTimerSec ?? 0} s</ThemedText>
      </ActivitySection>

      {trials.length > 0 ? (
        <ActivitySection title="Trial Results">
          <TrialResultsTable
            rows={trials.map((trial, index) => ({
              label: trial.label || `Trial ${index + 1}`,
              prediction: trial.prediction || '—',
              outcome: trial.fallTimeSec != null
                ? `${trial.fallTimeSec.toFixed(3)} s fall${trial.gForce != null ? `, ${trial.gForce.toFixed(1)} g` : ''}`
                : '—',
            }))}
          />
          {trials[0]?.impactSpeedMs != null ? (
            <PhysicsResultPanel
              values={{
                impactSpeedMs: trials[0].impactSpeedMs ?? null,
                accelerationMs2: trials[0].accelerationMs2 ?? null,
                netForceN: trials[0].netForceN ?? null,
                dragForceN: trials[0].dragForceN ?? null,
                gForce: trials[0].gForce ?? null,
              }}
            />
          ) : null}
        </ActivitySection>
      ) : null}

      {videosAvailable && (
        <ActivitySection title="Submitted Videos">
          <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: SpacingScale.xs }}>
            Recorded drop videos for teacher review
          </ThemedText>
          {trials.map((trial, index) => {
            if (!trial.videoUri) return null;
            return (
              <TrialVideoPlayer
                key={index}
                uri={trial.videoUri}
                label={trial.label || `Trial ${index + 1}`}
              />
            );
          })}
        </ActivitySection>
      )}
    </>
  );
}

const videoStyles = StyleSheet.create({
  playerContainer: {
    marginBottom: SpacingScale.sm,
  },
  videoPlayer: {
    width: '100%',
    height: 220,
    borderRadius: Radii.md,
  },
});
