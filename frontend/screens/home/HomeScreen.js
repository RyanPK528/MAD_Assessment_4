import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

const ENGINEERING_ACTIVITIES = [
  {
    id: 1,
    title: 'Parachute Drop',
    subtitle: 'Engineering + Physics',
    emoji: '🪂',
    color: '#1565C0',
    screen: 'Activity1',
    sensors: 'Camera + Timer',
  },
  {
    id: 2,
    title: 'Sound Pollution',
    subtitle: 'Environmental Science',
    emoji: '🔊',
    color: '#6A1B9A',
    screen: 'Activity2',
    sensors: 'Microphone (dB)',
  },
  {
    id: 3,
    title: 'Hand Fan',
    subtitle: 'Physics – Air Movement',
    emoji: '💨',
    color: '#2E7D32',
    screen: 'Activity3',
    sensors: 'Accelerometer',
  },
  {
    id: 4,
    title: 'Earthquake Structure',
    subtitle: 'Engineering + Earth Science',
    emoji: '🏗️',
    color: '#BF360C',
    screen: 'Activity4',
    sensors: 'Gyroscope + Vibration',
  },
];

const HEALTH_ACTIVITIES = [
  {
    id: 5,
    title: 'Performance Lab',
    subtitle: 'Medical Science',
    emoji: '🏃',
    color: '#00695C',
    screen: 'Activity5',
    sensors: 'Accelerometer',
  },
  {
    id: 6,
    title: 'Reaction Board',
    subtitle: 'Neuroscience + Maths',
    emoji: '⚡',
    color: '#F57F17',
    screen: 'Activity6',
    sensors: 'Touch + Timer',
  },
  {
    id: 7,
    title: 'Breathing Trainer',
    subtitle: 'Medical Science',
    emoji: '🫁',
    color: '#C62828',
    screen: 'Activity7',
    sensors: 'Accelerometer',
  },
];

function ActivityCard({ activity, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(activity.screen, activity)}
      activeOpacity={0.75}
    >
      <View style={[styles.cardIconBg, { backgroundColor: activity.color + '1A' }]}>
        <Text style={styles.cardEmoji}>{activity.emoji}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{activity.title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{activity.subtitle}</Text>
        <View style={styles.sensorRow}>
          <Ionicons name="hardware-chip-outline" size={11} color={COLORS.textSecondary} />
          <Text style={styles.sensorText}>{activity.sensors}</Text>
        </View>
      </View>
      <View style={[styles.cardBadge, { backgroundColor: activity.color }]}>
        <Text style={styles.cardBadgeText}>#{activity.id}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { user, teamData } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || 'Scientist';
  const teamName = teamData?.teamName || 'Your Team';

  const goToActivity = (screen, activity) => {
    navigation.navigate(screen, { title: `${activity.emoji} ${activity.title}`, activityId: activity.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}! 👋</Text>
            <View style={styles.teamRow}>
              <Ionicons name="shield" size={14} color={COLORS.primary} />
              <Text style={styles.teamName}> {teamName}</Text>
              {teamData?.grade && <Text style={styles.grade}> · {teamData.grade}</Text>}
            </View>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {/* Sprint 3: notifications */}}
          >
            <Ionicons name="notifications-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Banner ────────────────────────── */}
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Ready to experiment? 🔬</Text>
            <Text style={styles.bannerBody}>7 challenges · 3 sprints</Text>
          </View>
          <View style={styles.bannerStats}>
            <Text style={styles.bannerStatNum}>7</Text>
            <Text style={styles.bannerStatLabel}>Activities</Text>
          </View>
        </View>

        {/* ── Engineering Activities ─────────── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="construct" size={18} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Engineering Challenges</Text>
        </View>
        {ENGINEERING_ACTIVITIES.map((a) => (
          <ActivityCard key={a.id} activity={a} onPress={goToActivity} />
        ))}

        {/* ── Health Activities ─────────────── */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Ionicons name="fitness" size={18} color={COLORS.secondary} />
          <Text style={[styles.sectionTitle, { color: COLORS.secondary }]}>Health & Medical Sciences</Text>
        </View>
        {HEALTH_ACTIVITIES.map((a) => (
          <ActivityCard key={a.id} activity={a} onPress={goToActivity} />
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 20,
  },
  greeting: { ...FONTS.h2, color: COLORS.textPrimary, marginBottom: 4 },
  teamRow: { flexDirection: 'row', alignItems: 'center' },
  teamName: { ...FONTS.body, color: COLORS.primary, fontWeight: '600' },
  grade: { ...FONTS.body, color: COLORS.textSecondary },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  banner: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerText: { flex: 1 },
  bannerTitle: { ...FONTS.h3, color: COLORS.textLight, marginBottom: 4 },
  bannerBody: { ...FONTS.body, color: COLORS.textLight + 'BB' },
  bannerStats: { alignItems: 'center', marginLeft: 16 },
  bannerStatNum: { fontSize: 36, fontWeight: '800', color: COLORS.textLight },
  bannerStatLabel: { ...FONTS.caption, color: COLORS.textLight + 'BB' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: { ...FONTS.h3, color: COLORS.primary },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardEmoji: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { ...FONTS.h4, color: COLORS.textPrimary, marginBottom: 2 },
  cardSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginBottom: 4 },
  sensorRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sensorText: { ...FONTS.caption, color: COLORS.textSecondary, fontSize: 11 },
  cardBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 32,
    alignItems: 'center',
  },
  cardBadgeText: { ...FONTS.caption, color: COLORS.textLight, fontWeight: '700' },
});
