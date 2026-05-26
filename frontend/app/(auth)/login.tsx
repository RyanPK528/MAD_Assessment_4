import { useRouter, Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';

import { loginUser } from '../../services/authService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // eslint-disable-next-line no-console
    console.log('[Login] Form submitted');
    
    setLoading(true);
    // eslint-disable-next-line no-console
    console.log('[Login] Calling loginUser...');
    try {
      await loginUser({ email, password });
      // eslint-disable-next-line no-console
      console.log('[Login] Authentication successful, navigating to dashboard');
      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed.';
      // eslint-disable-next-line no-console
      console.error('[Login] Authentication error:', message);
      Alert.alert('Login error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Login
      </ThemedText>
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
        autoCapitalize="none"
        secureTextEntry
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor="#999"
        style={styles.input}
        value={password}
      />
      <Pressable disabled={loading} onPress={handleLogin} style={styles.button}>
        <ThemedText type="subtitle">{loading ? 'Signing in…' : 'Sign In'}</ThemedText>
      </Pressable>
      <Link href="/signup" style={styles.link}>
        <ThemedText type="small">Create an account</ThemedText>
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
