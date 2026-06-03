import { Modal, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface RecordingCountdownOverlayProps {
  visible: boolean;
  countdown: number | null;
}

export function RecordingCountdownOverlay({ visible, countdown }: RecordingCountdownOverlayProps) {
  const theme = useTheme();

  if (!visible || countdown === null) {
    return null;
  }

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <ThemedText type="sectionTitle" style={{ color: theme.textPrimary }}>
          Get ready
        </ThemedText>
        <ThemedText type="pageTitle" style={styles.countdown}>
          {countdown}
        </ThemedText>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SpacingScale.md,
  },
  countdown: {
    fontSize: 96,
    lineHeight: 104,
  },
});
