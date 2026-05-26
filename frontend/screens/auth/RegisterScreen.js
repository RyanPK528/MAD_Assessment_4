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
import { registerUser } from '../../services/firebase/authService';

const FIREBASE_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'Network error. Check your connection.',
};

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.displayName.trim()) e.displayName = 'Your name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters required';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await registerUser({
        email: form.email.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
      });
      // onAuthStateChanged fires in AuthContext → user set → teamData null
      // → AppNavigator automatically shows OnboardingNavigator (TeamSetup)
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        FIREBASE_ERROR_MESSAGES[error.code] || 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ field, label, placeholder, icon, secure, showToggle, onToggle, keyboardType, autoComplete }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={form[field]}
          onChangeText={(t) => update(field, t)}
          secureTextEntry={secure && !showToggle}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={field === 'email' ? 'none' : field === 'displayName' ? 'words' : 'none'}
          autoComplete={autoComplete}
          returnKeyType="next"
        />
        {secure && (
          <TouchableOpacity onPress={onToggle} style={styles.eyeBtn}>
            <Ionicons
              name={showToggle ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

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
          {/* ── Header ─────────────────────────────── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerBrand}>
              <Ionicons name="flask" size={24} color={COLORS.primary} />
              <Text style={styles.headerBrandText}>STEMM Lab</Text>
            </View>
          </View>

          {/* ── Title ──────────────────────────────── */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the science adventure</Text>
          </View>

          {/* ── Form ───────────────────────────────── */}
          <View style={styles.card}>
            <Field
              field="displayName"
              label="Your Name"
              placeholder="e.g. Alex Johnson"
              icon="person-outline"
              autoComplete="name"
            />
            <Field
              field="email"
              label="Email Address"
              placeholder="your@email.com"
              icon="mail-outline"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Field
              field="password"
              label="Password"
              placeholder="Min. 6 characters"
              icon="lock-closed-outline"
              secure
              showToggle={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              autoComplete="new-password"
            />
            <Field
              field="confirmPassword"
              label="Confirm Password"
              placeholder="Re-enter your password"
              icon="shield-checkmark-outline"
              secure
              showToggle={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              autoComplete="new-password"
            />

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textLight} />
              ) : (
                <>
                  <Text style={styles.registerBtnText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.textLight} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Login Link ─────────────────────────── */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 6 },
  headerBrandText: { ...FONTS.h3, color: COLORS.primary },

  titleSection: { marginBottom: 24 },
  title: { ...FONTS.h1, color: COLORS.textPrimary, marginBottom: 4 },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary },

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

  registerBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.6 },
  registerBtnText: { ...FONTS.button, color: COLORS.textLight },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { ...FONTS.body, color: COLORS.textSecondary },
  loginLink: { ...FONTS.body, color: COLORS.primary, fontWeight: '700' },
});
