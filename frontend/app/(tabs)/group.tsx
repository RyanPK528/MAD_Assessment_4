import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, Modal, Alert } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const groupInfo = {
  name: 'Group Orion',
  gradeLevel: 'Grade 10',
  discriminator: 'A4B7F9',
  members: [
    { id: 'me', name: 'Alya', role: 'Team Lead' },
    { id: 'member-2', name: 'Mia', role: 'Engineer' },
    { id: 'member-3', name: 'Noah', role: 'Scientist' },
    { id: 'member-4', name: 'Rizky', role: 'Researcher' },
    { id: 'member-5', name: 'Sasha', role: 'Designer' },
  ],
};

export default function GroupScreen() {
  const theme = useTheme();
  const [groupName, setGroupName] = useState(groupInfo.name);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUser = groupInfo.members[0];
  const sortedMembers = [currentUser, ...groupInfo.members.slice(1)];

  const handleCopyId = async () => {
    if (Platform.OS === 'web' && typeof navigator.clipboard !== 'undefined') {
      await navigator.clipboard.writeText(groupInfo.discriminator);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } else {
      Alert.alert('Group ID', `Copy this code: ${groupInfo.discriminator}`);
    }
  };

  const handleLeaveConfirm = () => {
    setShowConfirmation(false);
    Alert.alert('Left group', 'You have been removed from the group.');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <View>
            <ThemedText type="title">{groupName}</ThemedText>
            <View style={styles.inlineRow}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>{groupInfo.gradeLevel}</ThemedText>
              <View style={[styles.badge, { backgroundColor: theme.accent }]}> 
                <SymbolView name="pencil" size={12} tintColor="#FFF" />
                <ThemedText type="smallBold" style={styles.badgeText}>Edit</ThemedText>
              </View>
            </View>
          </View>
        </View>

        <ThemedView style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
          <View style={styles.infoRow}>
            <View>
              <ThemedText type="smallBold">Group ID</ThemedText>
              <ThemedText type="body">{groupInfo.discriminator}</ThemedText>
            </View>
            <Pressable onPress={handleCopyId} style={({ pressed }) => [styles.copyButton, pressed && styles.buttonPressed, { backgroundColor: theme.backgroundSelected }]}>
              <SymbolView name="doc.on.doc.fill" size={18} tintColor={theme.accent} />
              <ThemedText type="smallBold" style={[styles.copyLabel, { color: theme.accent }]}>
                {copied ? 'Copied' : 'Copy'}
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Group members</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>Sorted with you at the top.</ThemedText>
        </View>

        <View style={styles.membersList}>
          {sortedMembers.map((member) => (
            <View key={member.id} style={[styles.memberRow, { backgroundColor: member.id === currentUser.id ? theme.backgroundSelected : theme.surface, borderColor: member.id === currentUser.id ? theme.accent : theme.border }]}> 
              <View>
                <ThemedText type="subtitle">{member.name}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>{member.role}</ThemedText>
              </View>
              {member.id === currentUser.id ? (
                <View style={[styles.youBadge, { backgroundColor: theme.accent }]}> 
                  <ThemedText type="smallBold" style={styles.badgeText}>You</ThemedText>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <View style={[styles.dangerZone, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}> 
          <ThemedText type="subtitle">Danger zone</ThemedText>
          <ThemedText type="small" style={[styles.dangerText, { color: theme.danger }]}>Leaving this group will remove your progress and access to shared content.</ThemedText>
          <Pressable
            onPress={() => setShowConfirmation(true)}
            style={({ pressed }) => [styles.leaveButton, pressed && styles.buttonPressed, { backgroundColor: theme.danger }]}> 
            <ThemedText type="button" style={styles.leaveText}>Leave group</ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={showConfirmation} onRequestClose={() => setShowConfirmation(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
            <ThemedText type="subtitle">Confirm exit</ThemedText>
            <ThemedText type="body" style={[styles.modalContent, { color: theme.textSecondary }]}>Are you sure you want to leave this group?</ThemedText>
            <View style={styles.modalButtonsRow}>
              <Pressable
                onPress={() => setShowConfirmation(false)}
                style={({ pressed }) => [styles.modalButton, styles.modalCancel, pressed && styles.buttonPressed, { backgroundColor: theme.backgroundSelected }]}> 
                <ThemedText type="button">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={handleLeaveConfirm}
                style={({ pressed }) => [styles.modalButton, styles.modalConfirm, pressed && styles.buttonPressed, { backgroundColor: theme.accent }]}> 
                <ThemedText type="button" style={styles.confirmText}>Confirm</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  headingRow: {
    gap: Spacing.two,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  copyLabel: {
  },
  sectionHeader: {
    gap: Spacing.one,
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
  currentUserRow: {
  },
  youBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
  dangerZone: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
  },
  dangerText: {
  },
  leaveButton: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  leaveText: {
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: Spacing.four,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 8,
  },
  modalContent: {
    color: '#D1D1E1',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#2F2F3D',
  },
  modalConfirm: {
    backgroundColor: '#D9534F',
  },
  confirmText: {
    color: '#FFF',
  },
});
