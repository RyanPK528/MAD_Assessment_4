import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { loginUser } from '@/services/authService';
import { Layout, SpacingScale } from '@/constants/theme';
import { useUiStyles } from '@/hooks/use-ui-styles';

export default function LoginScreen() {
  const router = useRouter();
  const ui = useUiStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginUser({ email, password });
      router.replace('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      Alert.alert('Login error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={ui.screen}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <ThemedText type="pageTitle">Welcome back</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Sign in to your team account
              </ThemedText>
            </View>

            <AppCard>
              <AppInput
                label="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="team@school.edu"
                value={email}
              />
              <AppInput
                label="Password"
                autoCapitalize="none"
                secureTextEntry
                onChangeText={setPassword}
                placeholder="Enter password"
                value={password}
              />
              <AppButton label="Sign in" onPress={handleLogin} loading={loading} />
            </AppCard>

            <Link href="/signup" style={styles.link}>
              <ThemedText type="link" themeColor="accent" style={styles.linkText}>
                Create a team account
              </ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: SpacingScale.xxl,
    gap: Layout.sectionGap,
  },
  header: {
    gap: SpacingScale.xxs,
    marginBottom: SpacingScale.sm,
  },
  link: {
    alignItems: 'center',
  },
  linkText: {
    textAlign: 'center',
  },
});
