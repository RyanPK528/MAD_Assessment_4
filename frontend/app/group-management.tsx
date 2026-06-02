import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { registerUser } from '@/services/authService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function GroupManagementScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [teamName, setTeamName] = useState('');
  const [memberNames, setMemberNames] = useState('');
  const [gradeLevel, setGradeLevel] = useState<'Year 5' | 'Year 6' | 'Year 7' | 'Year 8' | 'Year 9' | 'Year 10'>('Year 7');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTeamAccount = async () => {
    const members = memberNames.split(',').map((name) => name.trim()).filter(Boolean);
    if (!teamName.trim() || !email.trim() || !password.trim() || members.length === 0) {
      Alert.alert('Validation error', 'Please enter team name, member names, email, and password.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        email,
        password,
        teamName,
        memberFirstNames: members,
        gradeLevel,
      });
      Alert.alert('Success', 'Team account created.');
      router.replace('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create group.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>Team Account Setup</ThemedText>

        {mode === 'choice' && (
          <View style={styles.choiceSection}>
            <ThemedText type="subtitle" style={[styles.subtitle, { color: theme.textSecondary }]}>Create one team account for your group.</ThemedText>

            <Pressable
              style={({ pressed }) => [styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressedCard]}
              onPress={() => setMode('create')}>
              <ThemedText type="subtitle">Create Team Account</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Set team name, members, grade, and sign-in credentials.</ThemedText>
            </Pressable>
          </View>
        )}

        {mode === 'create' && (
          <ThemedView style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
            <ThemedText type="subtitle" style={styles.formLabel}>Team Name</ThemedText>
            <TextInput
              placeholder="Enter team name"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
              value={teamName}
              onChangeText={setTeamName}
            />
            <ThemedText type="subtitle" style={styles.formLabel}>Member First Names</ThemedText>
            <TextInput
              placeholder="Comma-separated member names"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
              value={memberNames}
              onChangeText={setMemberNames}
            />

            <ThemedText type="subtitle" style={styles.formLabel}>Grade Level</ThemedText>
            <TextInput
              placeholder="Year 5 to Year 10"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
              value={gradeLevel}
              onChangeText={(value) => setGradeLevel(value as typeof gradeLevel)}
            />
            <ThemedText type="subtitle" style={styles.formLabel}>Team Email</ThemedText>
            <TextInput
              placeholder="team@example.com"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
              value={email}
              onChangeText={setEmail}
            />
            <ThemedText type="subtitle" style={styles.formLabel}>Password</ThemedText>
            <TextInput
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              style={({ pressed }) => [styles.submitButton, { backgroundColor: theme.accent }, pressed && styles.buttonPressed]}
              disabled={loading}
              onPress={handleCreateTeamAccount}>
              <ThemedText type="subtitle" style={styles.buttonText}>{loading ? 'Creating...' : 'Create Team Account'}</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border }, pressed && styles.buttonPressed]}
              onPress={() => setMode('choice')}>
              <ThemedText type="subtitle" style={[styles.buttonText, { color: theme.text }]}>Back</ThemedText>
            </Pressable>
          </ThemedView>
        )}

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.four,
  },
  choiceSection: {
    gap: Spacing.four,
  },
  actionCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.two,
  },
  pressedCard: {
    opacity: 0.92,
  },
  submitButton: {
    marginTop: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFF',
  },
  formCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 4,
  },
  formSection: {
    gap: Spacing.three,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  formLabel: {
    marginBottom: Spacing.one,
  },
  input: {
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderRadius: Spacing.three,
  },
  groupsList: {},
  groupsTitle: {},
  groupItem: {},
});
