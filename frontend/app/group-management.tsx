import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { createGroup, joinGroup, fetchAvailableGroups, GroupDocument } from '@/services/groupService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function GroupManagementScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [groupName, setGroupName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [availableGroups, setAvailableGroups] = useState<GroupDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a full app this could be loaded from auth or deep link state.
  }, []);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !gradeLevel.trim()) {
      Alert.alert('Validation error', 'Please enter a group name and grade level.');
      return;
    }

    setLoading(true);
    try {
      Alert.alert('Success', 'Group created! (Note: full implementation requires user context)');
      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create group.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (group: GroupDocument) => {
    setLoading(true);
    try {
      Alert.alert('Success', `Joined group: ${group.name}`);
      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to join group.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableGroups = async () => {
    if (!gradeLevel.trim()) {
      Alert.alert('Error', 'Please enter your grade level first.');
      return;
    }

    setLoading(true);
    try {
      const groups = await fetchAvailableGroups(Number(gradeLevel));
      setAvailableGroups(groups);
      if (groups.length === 0) {
        Alert.alert('No groups found', 'No groups available for your grade level. Create a new one!');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load groups.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText type="title" style={styles.title}>{mode === 'choice' ? 'Group Management' : mode === 'create' ? 'Create a Group' : 'Join a Group'}</ThemedText>

        {mode === 'choice' && (
          <View style={styles.choiceSection}>
            <ThemedText type="subtitle" style={[styles.subtitle, { color: theme.textSecondary }]}>You don't have a group yet. Would you like to create or join one?</ThemedText>

            <Pressable
              style={({ pressed }) => [styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressedCard]}
              onPress={() => setMode('create')}>
              <ThemedText type="subtitle">Create a Group</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Start a new classroom team.</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressedCard]}
              onPress={() => setMode('join')}>
              <ThemedText type="subtitle">Join a Group</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>Find an existing team with your grade.</ThemedText>
            </Pressable>
          </View>
        )}

        {mode === 'create' && (
          <ThemedView style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
            <ThemedText type="subtitle" style={styles.formLabel}>Group Name</ThemedText>
            <TextInput
              placeholder="Enter group name"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
              value={groupName}
              onChangeText={setGroupName}
            />

            <ThemedText type="subtitle" style={styles.formLabel}>Grade Level</ThemedText>
            <TextInput
              placeholder="Enter grade level"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
              value={gradeLevel}
              keyboardType="numeric"
              onChangeText={setGradeLevel}
            />

            <Pressable
              style={({ pressed }) => [styles.submitButton, { backgroundColor: theme.accent }, pressed && styles.buttonPressed]}
              disabled={loading}
              onPress={handleCreateGroup}>
              <ThemedText type="subtitle" style={styles.buttonText}>{loading ? 'Creating...' : 'Create Group'}</ThemedText>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, { borderColor: theme.border }, pressed && styles.buttonPressed]}
              onPress={() => setMode('choice')}>
              <ThemedText type="subtitle" style={[styles.buttonText, { color: theme.text }]}>Back</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {mode === 'join' && (
          <ThemedView style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
            <ThemedText type="subtitle" style={styles.formLabel}>Grade Level</ThemedText>
            <TextInput
              placeholder="Enter your grade level"
              placeholderTextColor={theme.muted}
              style={[styles.input, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
              value={gradeLevel}
              keyboardType="numeric"
              onChangeText={setGradeLevel}
            />

            <Pressable
              style={({ pressed }) => [styles.submitButton, { backgroundColor: theme.accent }, pressed && styles.buttonPressed]}
              disabled={loading}
              onPress={loadAvailableGroups}>
              <ThemedText type="subtitle" style={styles.buttonText}>{loading ? 'Loading...' : 'Find Groups'}</ThemedText>
            </Pressable>

            {availableGroups.length > 0 && (
              <View style={styles.groupsList}>
                <ThemedText type="subtitle" style={styles.groupsTitle}>Available Groups</ThemedText>
                {availableGroups.map((group) => (
                  <Pressable
                    key={group.id}
                    style={[styles.groupItem, { backgroundColor: theme.backgroundSelected, borderColor: theme.accent }]}
                    onPress={() => handleJoinGroup(group)}>
                    <ThemedText type="body">{group.name}</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>Members: {group.memberCount}</ThemedText>
                  </Pressable>
                ))}
              </View>
            )}

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
  groupsList: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  groupsTitle: {
    marginBottom: Spacing.two,
  },
  groupItem: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
});