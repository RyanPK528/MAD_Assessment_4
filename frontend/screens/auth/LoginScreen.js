import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { loginUser, resetPassword } from '../../services/firebase/authService';

const FIREBASE_ERROR_MESSAGES = {
  'auth/user-not-found': 'No account found with this email.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearField = (field) => setErrors((prev) => ({ ...prev, [field]: null }));

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await loginUser({ email: email.trim(), password });
      // AuthContext.onAuthStateChanged fires → AppNavigator switches to MainNavigator
    } catch (error) {
      Alert.alert(
        'Login Failed',
        FIREBASE_ERROR_MESSAGES[error.code] || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Reset Password', 'Enter your email address above, then tap Forgot Password.');
      return;
    }
    Alert.alert('Reset Password', `Send a reset link to ${email.trim()}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: async () => {
          try {
            await resetPassword(email.trim());
            Alert.alert('Email Sent', 'Check your inbox for the password reset link.');
          } catch {
            Alert.alert('Error', 'Could not send reset email. Check the address and try again.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ─────────────────────────────── */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="flask" size={48} color={COLORS.textLight} />
            </View>
            <Text style={styles.appName}>STEMM Lab</Text>
            <Text style={styles.tagline}>Real-World Science Adventures</Text>
          </View>

          {/* ── Form Card ────────────────────────── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue your experiments</Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textSecondary}
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearField('email'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textSecondary}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearField('password'); }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textLight} />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.textLight} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Register Link ─────────────────────── */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  logoSection: { alignItems: 'center', marginTop: 48, marginBottom: 36 },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  appName: { ...FONTS.h1, color: COLORS.textPrimary, marginBottom: 4 },
  tagline: { ...FONTS.body, color: COLORS.textSecondary },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 28,
  },
  cardTitle: { ...FONTS.h2, color: COLORS.textPrimary, marginBottom: 4 },
  cardSubtitle: { ...FONTS.body, color: COLORS.textSecondary, marginBottom: 24 },

  inputGroup: { marginBottom: 16 },
  label: { ...FONTS.label, color: COLORS.textPrimary, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 52,
  },
  inputError: { borderColor: COLORS.error },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, ...FONTS.body, color: COLORS.textPrimary },
  eyeBtn: { padding: 4 },
  errorText: { ...FONTS.caption, color: COLORS.error, marginTop: 5 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -4 },
  forgotText: { ...FONTS.caption, color: COLORS.primary, fontWeight: '600' },

  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  loginBtnText: { ...FONTS.button, color: COLORS.textLight },

  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { ...FONTS.body, color: COLORS.textSecondary },
  registerLink: { ...FONTS.body, color: COLORS.primary, fontWeight: '700' },
});
