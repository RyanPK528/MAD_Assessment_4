import { useRouter, Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { registerUser } from '../../services/authService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [grade, setGrade] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    // eslint-disable-next-line no-console
    console.log('[Signup] Form submitted');
    
    const parsedGrade = Number(grade);
    if (!firstName.trim() || !email.trim() || !password.trim() || Number.isNaN(parsedGrade) || parsedGrade <= 0) {
      const validationMsg = 'Please fill every field and enter a valid grade level.';
      // eslint-disable-next-line no-console
      console.log('[Signup] Validation failed:', validationMsg);
      Alert.alert('Registration error', validationMsg);
      return;
    }

    setLoading(true);
    // eslint-disable-next-line no-console
    console.log('[Signup] Calling registerUser...');
    try {
      await registerUser({ email, password, firstName, grade: parsedGrade });
      // eslint-disable-next-line no-console
      console.log('[Signup] Registration successful, navigating to dashboard');
      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Sign-up failed.';
      // eslint-disable-next-line no-console
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
        onChangeText={setFirstName}
        placeholder="First Name"
        placeholderTextColor="#999"
        style={styles.input}
        value={firstName}
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
      <TextInput
        keyboardType="numeric"
        onChangeText={setGrade}
        placeholder="Grade Level"
        placeholderTextColor="#999"
        style={styles.input}
        value={grade}
      />
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
  link: {
    marginTop: Spacing.two,
    alignItems: 'center',
  },
});
