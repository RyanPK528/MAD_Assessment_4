import { useCallback, useState } from 'react';
import { useFocusLoad } from '@/hooks/use-focus-load';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { SectionHeader } from '@/components/ui/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeContext } from '@/components/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { useUiStyles } from '@/hooks/use-ui-styles';
import { getFirebaseAuth } from '@/config/firebaseNative';
import { getUserProfile, TeamGradeLevel, updateTeamProfile } from '@/services/authService';
import { fetchGroupForUser } from '@/services/groupService';
import { Layout, Radii, SpacingScale } from '@/constants/theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const ui = useUiStyles();
  const { mode, setMode } = useThemeContext();
  const [teamName, setTeamName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<TeamGradeLevel>('Year 7');
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [teamDiscriminatorId, setTeamDiscriminatorId] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const uid = getFirebaseAuth()?.currentUser?.uid;
    if (!uid) return;
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
    <ThemedView style={ui.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHeader}>
            <ThemedText type="pageTitle">Settings</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Manage your team and app preferences
            </ThemedText>
          </View>

          {teamDiscriminatorId ? (
            <AppCard>
              <ThemedText type="captionBold" themeColor="textSecondary">
                Team ID
              </ThemedText>
              <ThemedText type="sectionTitle" style={styles.teamId}>
                {teamDiscriminatorId}
              </ThemedText>
            </AppCard>
          ) : null}

          <AppCard>
            <SectionHeader title="Team profile" subtitle="Update your team details" />
            <AppInput label="Team name" value={teamName} onChangeText={setTeamName} />
            <ThemedText type="captionBold" style={styles.fieldLabel}>
              Grade level
            </ThemedText>
            <View style={styles.chipRow}>
              {(['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'] as const).map((year) => {
                const selected = gradeLevel === year;
                return (
                  <Pressable
                    key={year}
                    onPress={() => setGradeLevel(year)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[ui.chip, selected && ui.chipActive]}
                  >
                    <ThemedText type="captionBold" style={{ color: selected ? theme.onAccent : theme.textPrimary }}>
                      {year}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          <AppCard>
            <SectionHeader title="Members" subtitle={`${memberNames.length} team member(s)`} />
            <View style={styles.membersList}>
              {memberNames.map((member) => (
                <View key={member} style={[styles.memberRow, { borderColor: theme.border }]}>
                  <ThemedText type="bodyMedium">{member}</ThemedText>
                  <Pressable
                    onPress={() => removeMember(member)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${member}`}
                    style={[styles.removeButton, { backgroundColor: theme.dangerMuted }]}
                  >
                    <ThemedText type="captionBold" themeColor="danger">
                      Remove
                    </ThemedText>
                  </Pressable>
                </View>
              ))}
            </View>
            <AppInput
              label="Add member"
              value={newMemberName}
              onChangeText={setNewMemberName}
              placeholder="First name"
            />
            <AppButton label="Add member" onPress={addMember} variant="secondary" />
          </AppCard>

          <AppCard>
            <SectionHeader title="Appearance" subtitle="Choose light or dark mode" />
            <View style={styles.themeRow}>
              {(['light', 'dark'] as const).map((option) => {
                const selected = mode === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setMode(option)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.themeOption, selected && { backgroundColor: theme.accent, borderColor: theme.accent }, !selected && { borderColor: theme.border }]}
                  >
                    <ThemedText type="bodyMedium" style={{ color: selected ? theme.onAccent : theme.textPrimary }}>
                      {option === 'light' ? 'Light' : 'Dark'}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </AppCard>

          <AppButton label={loading ? 'Saving…' : 'Save team changes'} onPress={handleSave} loading={loading} variant="success" />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: SpacingScale.xl,
    paddingBottom: SpacingScale.huge,
    gap: Layout.sectionGap,
  },
  pageHeader: {
    gap: SpacingScale.xxs,
  },
  teamId: {
    letterSpacing: 4,
  },
  fieldLabel: {
    marginTop: SpacingScale.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SpacingScale.xs,
  },
  membersList: {
    gap: SpacingScale.xs,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SpacingScale.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  removeButton: {
    paddingHorizontal: SpacingScale.sm,
    paddingVertical: SpacingScale.xxs,
    borderRadius: Radii.pill,
  },
  themeRow: {
    flexDirection: 'row',
    gap: SpacingScale.sm,
  },
  themeOption: {
    flex: 1,
    minHeight: Layout.buttonHeightSm,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
