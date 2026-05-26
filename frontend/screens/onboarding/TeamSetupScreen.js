import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { saveTeamData } from '../../services/firebase/authService';
import { useAuth } from '../../context/AuthContext';

const YEAR_LEVELS = [
  'Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12',
];

/** Random 4-digit number assigned by the app */
const generateDiscriminator = () => String(Math.floor(1000 + Math.random() * 9000));

export default function TeamSetupScreen() {
  const { user, setTeamData } = useAuth();
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(['', '']);
  const [grade, setGrade] = useState('');
  const [gradeOpen, setGradeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [discriminator] = useState(generateDiscriminator);

  const validate = () => {
    const e = {};
    if (!teamName.trim()) e.teamName = 'Team name is required';
    else if (teamName.trim().length < 3) e.teamName = 'Team name must be at least 3 characters';
    if (!members[0].trim()) e.member0 = 'At least one member name is required';
    if (!grade) e.grade = 'Please select your grade level';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const cleanName = teamName.trim();
      const data = {
        teamName: cleanName,
        members: members.map((m) => m.trim()).filter(Boolean),
        grade,
        discriminator,
        teamCode: `${cleanName.toUpperCase().replace(/\s+/g, '')}-${discriminator}`,
        userId: user.uid,
        userEmail: user.email,
      };
      await saveTeamData(user.uid, data);
      setTeamData(data); // triggers AppNavigator to show MainNavigator
    } catch (err) {
      console.error('[TeamSetup] save error:', err);
      Alert.alert('Error', 'Could not save team data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateMember = (index, value) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
    if (index === 0) setErrors((e) => ({ ...e, member0: null }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={38} color={COLORS.textLight} />
          </View>
          <Text style={styles.title}>Set Up Your Team</Text>
          <Text style={styles.subtitle}>Create your team profile to start competing on the leaderboard</Text>
        </View>

        {/* ── Team Identity ───────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="shield" size={14} color={COLORS.primary} /> Team Identity
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Team Name</Text>
            <View style={[styles.inputWrapper, errors.teamName && styles.inputError]}>
              <Ionicons name="shield-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. The Rocket Scientists"
                placeholderTextColor={COLORS.textSecondary}
                value={teamName}
                onChangeText={(t) => { setTeamName(t); setErrors((e) => ({ ...e, teamName: null })); }}
                maxLength={30}
              />
            </View>
            {errors.teamName && <Text style={styles.errorText}>{errors.teamName}</Text>}
          </View>

          {/* Auto-generated Team Code badge */}
          <View style={styles.codeRow}>
            <Ionicons name="key-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.codeLabel}>Team Discriminator:</Text>
            <View style={styles.codeBadge}>
              <Text style={styles.codeValue}>{discriminator}</Text>
            </View>
            <Text style={styles.codeHint}>(auto-assigned)</Text>
          </View>
        </View>

        {/* ── Team Members ────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="people" size={14} color={COLORS.primary} /> Team Members
          </Text>
          {[0, 1].map((i) => (
            <View style={styles.inputGroup} key={i}>
              <Text style={styles.label}>
                Member {i + 1} {i === 0 ? '(required)' : '(optional)'}
              </Text>
              <View style={[styles.inputWrapper, i === 0 && errors.member0 && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={`First name of member ${i + 1}`}
                  placeholderTextColor={COLORS.textSecondary}
                  value={members[i]}
                  onChangeText={(t) => updateMember(i, t)}
                  autoCapitalize="words"
                />
              </View>
              {i === 0 && errors.member0 && <Text style={styles.errorText}>{errors.member0}</Text>}
            </View>
          ))}
        </View>

        {/* ── Grade Level ─────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="school" size={14} color={COLORS.primary} /> School Year
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Grade / Year Level</Text>
            <TouchableOpacity
              style={[styles.inputWrapper, styles.pickerRow, errors.grade && styles.inputError]}
              onPress={() => setGradeOpen((o) => !o)}
              activeOpacity={0.7}
            >
              <Ionicons name="school-outline" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
              <Text style={[styles.pickerText, !grade && { color: COLORS.textSecondary }]}>
                {grade || 'Select year level'}
              </Text>
              <Ionicons
                name={gradeOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            {errors.grade && <Text style={styles.errorText}>{errors.grade}</Text>}

            {gradeOpen && (
              <View style={styles.dropdown}>
                {YEAR_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.dropdownItem, grade === level && styles.dropdownItemActive]}
                    onPress={() => {
                      setGrade(level);
                      setGradeOpen(false);
                      setErrors((e) => ({ ...e, grade: null }));
                    }}
                  >
                    <Text style={[styles.dropdownText, grade === level && styles.dropdownTextActive]}>
                      {level}
                    </Text>
                    {grade === level && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Submit ──────────────────────────── */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.textLight} />
          ) : (
            <>
              <Ionicons name="rocket" size={22} color={COLORS.textLight} />
              <Text style={styles.submitText}>Launch STEMM Lab!</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 48 },

  header: { alignItems: 'center', marginTop: 28, marginBottom: 28 },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { ...FONTS.h1, color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 16 },

  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { ...FONTS.h4, color: COLORS.primary, marginBottom: 14 },

  inputGroup: { marginBottom: 12 },
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
  errorText: { ...FONTS.caption, color: COLORS.error, marginTop: 5 },

  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  codeLabel: { ...FONTS.caption, color: COLORS.textSecondary },
  codeBadge: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  codeValue: { ...FONTS.caption, color: COLORS.primary, fontWeight: '700' },
  codeHint: { ...FONTS.caption, color: COLORS.textSecondary },

  pickerRow: { justifyContent: 'space-between' },
  pickerText: { flex: 1, ...FONTS.body, color: COLORS.textPrimary },
  dropdown: {
    marginTop: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  dropdownItemActive: { backgroundColor: COLORS.primary + '12' },
  dropdownText: { ...FONTS.body, color: COLORS.textPrimary },
  dropdownTextActive: { color: COLORS.primary, fontWeight: '600' },

  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 7,
  },
  btnDisabled: { opacity: 0.6 },
  submitText: { ...FONTS.button, color: COLORS.textLight, fontSize: 18 },
});
