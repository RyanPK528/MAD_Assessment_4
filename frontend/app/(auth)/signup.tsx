import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { registerUser, TeamGradeLevel } from '@/services/authService';
import { Layout, SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUiStyles } from '@/hooks/use-ui-styles';

const gradeOptions: TeamGradeLevel[] = ['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'];

export default function SignupScreen() {
  const router = useRouter();
  const theme = useTheme();
  const ui = useUiStyles();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [memberNames, setMemberNames] = useState('');
  const [gradeLevel, setGradeLevel] = useState<TeamGradeLevel>('Year 7');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    const members = memberNames.split(',').map((name) => name.trim()).filter(Boolean);
    if (!teamName.trim() || members.length === 0 || !email.trim() || !password.trim()) {
      Alert.alert('Registration error', 'Please provide team name, member names, email, and password.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ email, password, teamName, memberFirstNames: members, gradeLevel });
      router.replace('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign-up failed.';
      Alert.alert('Sign-up error', message);
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
              <ThemedText type="pageTitle">Create team</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                One account per team — register your group details
              </ThemedText>
            </View>

            <AppCard>
              <AppInput label="Team name" onChangeText={setTeamName} placeholder="Team name" value={teamName} />
              <AppInput
                label="Member first names"
                onChangeText={setMemberNames}
                placeholder="Comma-separated names"
                value={memberNames}
              />
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
                secureTextEntry
                onChangeText={setPassword}
                placeholder="Create a password"
                value={password}
              />

              <ThemedText type="captionBold">Grade level</ThemedText>
              <View style={styles.chipRow}>
                {gradeOptions.map((year) => {
                  const selected = gradeLevel === year;
                  return (
                    <Pressable
                      key={year}
                      onPress={() => setGradeLevel(year)}
                      style={[ui.chip, selected && ui.chipActive]}
                    >
                      <ThemedText type="captionBold" style={{ color: selected ? theme.onAccent : theme.textPrimary }}>
                        {year}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              <AppButton label="Create account" onPress={handleSignup} loading={loading} />
            </AppCard>

            <Link href="/login" style={styles.link}>
              <ThemedText type="link" themeColor="accent" style={styles.linkText}>
                Already registered? Sign in
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
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: SpacingScale.xl,
    gap: Layout.sectionGap,
  },
  header: {
    gap: SpacingScale.xxs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SpacingScale.xs,
  },
  link: {
    alignItems: 'center',
  },
  linkText: {
    textAlign: 'center',
  },
});
