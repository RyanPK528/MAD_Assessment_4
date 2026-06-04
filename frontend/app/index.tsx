import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, MaxContentWidth, SpacingScale } from '@/constants/theme';
import { useUiStyles } from '@/hooks/use-ui-styles';

export default function HomeScreen() {
  const router = useRouter();
  const ui = useUiStyles();

  return (
    <ThemedView style={ui.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <ThemedText type="display" style={styles.title}>
            STEMM Lab
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.subtitle}>
            Transform real-world activities into engaging STEMM learning experiences.
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <AppButton label="Log in" onPress={() => router.push('/login')} />
          <AppButton label="Create team account" onPress={() => router.push('/signup')} variant="secondary" />
        </View>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.hint}>
          Register your team, complete sensor-driven challenges, and climb the leaderboard.
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: SpacingScale.xxl,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Layout.sectionGap,
  },
  hero: {
    gap: SpacingScale.sm,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 360,
  },
  actions: {
    width: '100%',
    gap: SpacingScale.sm,
  },
  hint: {
    textAlign: 'center',
    maxWidth: 400,
    alignSelf: 'center',
  },
});
