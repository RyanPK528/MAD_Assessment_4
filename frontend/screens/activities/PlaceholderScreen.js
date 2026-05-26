import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

/**
 * Temporary placeholder for Activity screens not yet built.
 * Sprint 2: Replace each route in MainNavigator.js with the real screen.
 */
export default function PlaceholderScreen({ navigation, route }) {
  const { title = 'Activity', activityId } = route?.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.icon}>🚧</Text>
        <Text style={styles.comingSoon}>Coming in Sprint 2</Text>
        <Text style={styles.description}>
          Activity {activityId} is under construction. Full sensor integration and data capture will be implemented in the next sprint.
        </Text>
        <TouchableOpacity style={styles.backBtnLarge} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.backBtnText}>Back to Activities</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { ...FONTS.h4, color: COLORS.textPrimary, flex: 1, textAlign: 'center' },

  body: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  icon: { fontSize: 64, marginBottom: 16 },
  comingSoon: { ...FONTS.h2, color: COLORS.textPrimary, marginBottom: 12, textAlign: 'center' },
  description: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 32 },
  backBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtnText: { ...FONTS.button, color: COLORS.primary },
});
