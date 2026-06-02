import { useCallback, useState } from 'react';
import { useFocusLoad } from '@/hooks/use-focus-load';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeContext } from '@/components/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { getFirebaseAuth } from '@/config/firebaseNative';
import { getUserProfile, TeamGradeLevel, updateTeamProfile } from '@/services/authService';
import { fetchGroupForUser } from '@/services/groupService';

export default function SettingsScreen() {
  const theme = useTheme();
  const { mode, setMode } = useThemeContext();
  const [teamName, setTeamName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<TeamGradeLevel>('Year 7');
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [teamDiscriminatorId, setTeamDiscriminatorId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const uid = getFirebaseAuth()?.currentUser?.uid;
    if (!uid) {
      return;
    }
    const [profile, group] = await Promise.all([getUserProfile(uid), fetchGroupForUser(uid)]);
    if (profile) {
      setTeamName(profile.teamName);
      setGradeLevel(profile.gradeLevel);
      setMemberNames(profile.memberFirstNames);
    }
    if (group?.teamDiscriminatorId) {
      setTeamDiscriminatorId(group.teamDiscriminatorId);
    }
  }, []);

  useFocusLoad(load);

  const addMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    if (memberNames.includes(trimmed)) {
      Alert.alert('Duplicate member', 'That member name already exists.');
      return;
    }
    setMemberNames((current) => [...current, trimmed]);
    setNewMemberName('');
  };

  const removeMember = (name: string) => {
    setMemberNames((current) => current.filter((entry) => entry !== name));
  };

  const handleSave = async () => {
    const uid = getFirebaseAuth()?.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'You must be signed in.');
      return;
    }
    setLoading(true);
    try {
      await updateTeamProfile(uid, { teamName, gradeLevel, memberFirstNames: memberNames });
      Alert.alert('Saved', 'Team profile updated successfully.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update team.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Manage your team and app preferences.
        </ThemedText>

        {teamDiscriminatorId ? (
          <ThemedView style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <ThemedText type="smallBold">Team ID</ThemedText>
            <ThemedText type="subtitle" style={{ letterSpacing: 2 }}>
              {teamDiscriminatorId}
            </ThemedText>
          </ThemedView>
        ) : null}

        <ThemedView style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <ThemedText type="smallBold">Team Name</ThemedText>
          <TextInput value={teamName} onChangeText={setTeamName} style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} />
        </ThemedView>

        <View style={styles.inlineRow}>
          {(['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'] as const).map((year) => (
            <Pressable key={year} onPress={() => setGradeLevel(year)} style={[styles.badge, { backgroundColor: gradeLevel === year ? theme.accent : theme.backgroundSelected }]}>
              <ThemedText type="smallBold" style={styles.badgeText}>{year}</ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.membersList}>
          {memberNames.map((member) => (
            <View key={member} style={[styles.memberRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View>
                <ThemedText type="subtitle">{member}</ThemedText>
              </View>
              <Pressable onPress={() => removeMember(member)} style={[styles.youBadge, { backgroundColor: theme.danger }]}>
                <ThemedText type="smallBold" style={styles.badgeText}>Remove</ThemedText>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
          <ThemedText type="subtitle">Add Member</ThemedText>
          <TextInput value={newMemberName} onChangeText={setNewMemberName} placeholder="New member first name" placeholderTextColor={theme.textSecondary} style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} />
          <Pressable onPress={addMember} style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed, { backgroundColor: theme.accent }]}>
            <ThemedText type="button" style={styles.buttonText}>Add Member</ThemedText>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
          <ThemedText type="subtitle">Theme</ThemedText>
          <View style={styles.themeRow}>
            <Pressable
              onPress={() => setMode('light')}
              style={({ pressed }) => [
                styles.themeOption,
                pressed && styles.buttonPressed,
                { backgroundColor: mode === 'light' ? theme.accent : theme.surface },
              ]}
            >
              <ThemedText type="body" style={mode === 'light' ? styles.buttonText : { color: theme.textPrimary }}>
                Light Mode
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setMode('dark')}
              style={({ pressed }) => [
                styles.themeOption,
                pressed && styles.buttonPressed,
                { backgroundColor: mode === 'dark' ? theme.accent : theme.surface },
              ]}
            >
              <ThemedText type="body" style={mode === 'dark' ? styles.buttonText : { color: theme.textPrimary }}>
                Dark Mode
              </ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
          <Pressable onPress={handleSave} disabled={loading} style={({ pressed }) => [styles.actionButton, pressed && styles.buttonPressed, { backgroundColor: theme.success }]}>
            <ThemedText type="button" style={styles.buttonText}>{loading ? 'Saving...' : 'Save Team Changes'}</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FFF',
  },
  infoCard: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
    gap: Spacing.two,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
    elevation: 4,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  membersList: {
    gap: Spacing.two,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  youBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  section: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
  },
  actionButton: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  themeOption: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
