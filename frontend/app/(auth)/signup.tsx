import { useRouter, Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { registerUser } from '../../services/authService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [memberNames, setMemberNames] = useState('');
  const [gradeLevel, setGradeLevel] = useState<'Year 5' | 'Year 6' | 'Year 7' | 'Year 8' | 'Year 9' | 'Year 10'>('Year 7');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
     
    console.log('[Signup] Form submitted');
    
    const members = memberNames.split(',').map((name) => name.trim()).filter(Boolean);
    if (!teamName.trim() || members.length === 0 || !email.trim() || !password.trim()) {
      const validationMsg = 'Please provide team name, comma-separated member first names, email, and password.';
       
      console.log('[Signup] Validation failed:', validationMsg);
      Alert.alert('Registration error', validationMsg);
      return;
    }

    setLoading(true);
     
    console.log('[Signup] Calling registerUser...');
    try {
      await registerUser({ email, password, teamName, memberFirstNames: members, gradeLevel });
      router.replace('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign-up failed.';
       
      console.error('[Signup] Registration error:', message);
      Alert.alert('Sign-up error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Sign Up
      </ThemedText>
      <TextInput
        onChangeText={setTeamName}
        placeholder="Team Name"
        placeholderTextColor="#999"
        style={styles.input}
        value={teamName}
      />
      <TextInput
        onChangeText={setMemberNames}
        placeholder="Member First Names (comma-separated)"
        placeholderTextColor="#999"
        style={styles.input}
        value={memberNames}
      />
      <TextInput
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#999"
        style={styles.input}
        value={email}
      />
      <TextInput
        secureTextEntry
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#999"
        style={styles.input}
        value={password}
      />
      <View style={styles.gradeRow}>
        {(['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'] as const).map((year) => (
          <Pressable key={year} onPress={() => setGradeLevel(year)} style={[styles.gradeChip, gradeLevel === year ? styles.gradeChipActive : null]}>
            <ThemedText type="small">{year}</ThemedText>
          </Pressable>
        ))}
      </View>
      <Pressable disabled={loading} onPress={handleSignup} style={styles.button}>
        <ThemedText type="subtitle">{loading ? 'Creating account…' : 'Create Account'}</ThemedText>
      </Pressable>
      <Link href="/login" style={styles.link}>
        <ThemedText type="small">Already registered? Log in</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  input: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#1F1F2A',
    color: '#FFF',
  },
  button: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    backgroundColor: '#3E78FF',
  },
  gradeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  gradeChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    backgroundColor: '#1F1F2A',
  },
  gradeChipActive: {
    backgroundColor: '#3E78FF',
  },
  link: {
    marginTop: Spacing.two,
    alignItems: 'center',
  },
});