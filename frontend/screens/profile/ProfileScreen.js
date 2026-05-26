import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/firebase/authService';

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={17} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, teamData } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logoutUser },
    ]);
  };

  const initial = user?.displayName?.[0]?.toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Team Card */}
        {teamData && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Team Info</Text>
            <InfoRow icon="shield-outline" label="Team Name" value={teamData.teamName} />
            <InfoRow icon="key-outline" label="Team Code" value={teamData.teamCode} />
            <InfoRow icon="school-outline" label="Grade" value={teamData.grade} />
            <InfoRow icon="people-outline" label="Members" value={teamData.members?.join(', ')} />
          </View>
        )}

        {/* Account Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <InfoRow icon="mail-outline" label="Email" value={user?.email} />
          <InfoRow icon="finger-print-outline" label="User ID" value={user?.uid?.substring(0, 12) + '...'} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },

  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: COLORS.textLight },
  name: { ...FONTS.h2, color: COLORS.textPrimary, marginBottom: 4 },
  email: { ...FONTS.body, color: COLORS.textSecondary },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { ...FONTS.h4, color: COLORS.primary, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { ...FONTS.caption, color: COLORS.textSecondary, marginBottom: 2 },
  infoValue: { ...FONTS.body, color: COLORS.textPrimary, fontWeight: '500' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.error + '12',
    borderRadius: 12,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.error + '30',
    marginTop: 8,
  },
  logoutText: { ...FONTS.button, color: COLORS.error },
});
