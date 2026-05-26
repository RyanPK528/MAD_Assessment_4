import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';
import { COLORS } from '../constants/colors';

/**
 * Three-way gate:
 *   1. Loading  → spinner (checking AsyncStorage for persisted session)
 *   2. No user  → AuthNavigator (Login / Register)
 *   3. User but no teamData → OnboardingNavigator (Team Setup)
 *   4. User + teamData → MainNavigator (Home / Profile / Activities)
 */
export default function AppNavigator() {
  const { user, teamData, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) return <AuthNavigator />;
  if (!teamData) return <OnboardingNavigator />;
  return <MainNavigator />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
