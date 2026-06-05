import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TapChallengeState } from '@/services/reactionBoardService';
import { Radii, SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TARGET_SIZE = 80;

interface ReactionTapZoneProps {
  state: TapChallengeState;
  nonDominantHand?: boolean;
  onZonePress: () => void;
  onTargetPress: () => void;
}

export function ReactionTapZone({
  state,
  nonDominantHand = false,
  onZonePress,
  onTargetPress,
}: ReactionTapZoneProps) {
  const theme = useTheme();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const targetPosition = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return { x: 0, y: 0 };
    }
    const maxX = Math.max(0, containerSize.width - TARGET_SIZE);
    const maxY = Math.max(0, containerSize.height - TARGET_SIZE);
    return {
      x: Math.random() * maxX,
      y: Math.random() * maxY,
    };
  }, [state.stage, containerSize.width, containerSize.height]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const zoneBackground =
    state.stage === 'ready'
      ? theme.success
      : state.stage === 'tooSoon'
        ? theme.danger
        : state.stage === 'waiting'
          ? '#374151'
          : theme.backgroundElement;

  const placeholder =
    state.stage === 'idle'
      ? 'Start the challenge to reveal the reaction zone.'
      : state.stage === 'waiting'
        ? 'Wait for the target to appear…'
        : state.stage === 'tooSoon'
          ? 'Too soon! Wait for the signal.'
          : state.stage === 'complete'
            ? `Recorded: ${state.reactionTimeMs} ms`
            : 'Tap the target!';

  return (
    <View style={styles.wrapper}>
      <ThemedText type="small" themeColor="textSecondary">
        {nonDominantHand ? 'Use your non-dominant hand.' : 'Use your dominant hand.'}
      </ThemedText>
      <Pressable
        onPress={state.stage === 'ready' ? undefined : onZonePress}
        onLayout={handleLayout}
        style={[styles.zone, { backgroundColor: zoneBackground, borderColor: theme.border }]}
      >
        {state.stage === 'ready' ? (
          <Pressable
            onPress={onTargetPress}
            style={[
              styles.target,
              {
                backgroundColor: theme.accent,
                top: targetPosition.y,
                left: targetPosition.x,
              },
            ]}
          >
            <ThemedText type="captionBold" style={{ color: theme.onAccent }}>
              TAP
            </ThemedText>
          </Pressable>
        ) : (
          <ThemedText type="body" style={styles.placeholder}>
            {placeholder}
          </ThemedText>
        )}
      </Pressable>
      <ThemedText type="small">{state.message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SpacingScale.sm,
  },
  zone: {
    minHeight: 280,
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  target: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: SpacingScale.lg,
  },
});
