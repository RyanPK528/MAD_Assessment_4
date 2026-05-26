import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          STEMM Lab
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          A mobile science lab experience for students in the Expo managed workflow.
        </ThemedText>

        <View style={styles.actionGrid}>
          <Pressable onPress={() => router.push('/login')} style={styles.actionButton}>
            <ThemedText type="subtitle" style={styles.buttonText}>Log In</ThemedText>
          </Pressable>
          <Pressable onPress={() => router.push('/signup')} style={styles.actionButtonSecondary}>
            <ThemedText type="subtitle" style={styles.buttonText}>Sign Up</ThemedText>
          </Pressable>
        </View>

        <ThemedText type="small" style={styles.hintText}>
          Use STEMM Lab to register, join a group, and track sensor-driven science challenges.
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  actionGrid: {
    width: '100%',
    gap: Spacing.three,
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#1B82D1',
    alignItems: 'center',
  },
  actionButtonSecondary: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#2F2F3D',
    alignItems: 'center',
  },
  hintText: {
    marginTop: Spacing.four,
    textAlign: 'center',
    maxWidth: 480,
  },
  buttonText: {
    color: '#FFF',
  },
});
