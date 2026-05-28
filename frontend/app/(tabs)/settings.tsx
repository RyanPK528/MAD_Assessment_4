import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeContext } from '@/components/ThemeContext';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const gradeOptions = ['9', '10', '11', '12'];

export default function SettingsScreen() {
  const theme = useTheme();
  const { mode, setMode } = useThemeContext();
  const [displayName, setDisplayName] = useState('Alya');
  const [gradeLevel, setGradeLevel] = useState('10');

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}> 
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="title">Settings</ThemedText>
        <ThemedText type="small" style={[styles.subtitle, { color: theme.textSecondary }]}>Personalize your profile and app preferences.</ThemedText>

        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
          <View style={styles.fieldHeader}>
            <ThemedText type="subtitle">Profile</ThemedText>
            <SymbolView name="person.crop.circle.fill" tintColor={theme.accent} size={20} />
          </View>

          <ThemedText type="smallBold" style={styles.label}>Display username</ThemedText>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your display name"
            placeholderTextColor={theme.muted}
            style={[styles.input, { backgroundColor: theme.backgroundSelected, color: theme.text }]}
          />

          <ThemedText type="smallBold" style={styles.label}>Grade level</ThemedText>
          <View style={styles.selectRow}>
            {gradeOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => setGradeLevel(option)}
                style={({ pressed }) => [
                  styles.gradeOption,
                  gradeLevel === option && styles.gradeOptionActive,
                  pressed && styles.optionPressed,
                  { backgroundColor: gradeLevel === option ? theme.accent : theme.backgroundSelected },
                ]}>
                <ThemedText type="body" style={gradeLevel === option ? styles.gradeTextActive : [styles.gradeText, { color: theme.text }]}>{option}</ThemedText>
              </Pressable>
            ))}
          </View>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
          <View style={styles.fieldHeader}>
            <ThemedText type="subtitle">Theme</ThemedText>
            <SymbolView name="moon.fill" tintColor={theme.accent} size={20} />
          </View>

          <View style={styles.themeRow}>
            <Pressable
              onPress={() => setMode('light')}
              style={({ pressed }) => [
                styles.themeOption,
                mode === 'light' && styles.themeOptionActive,
                pressed && styles.optionPressed,
                { backgroundColor: mode === 'light' ? theme.accent : theme.backgroundSelected },
              ]}>
              <ThemedText type="body" style={mode === 'light' ? styles.themeTextActive : [styles.themeText, { color: theme.text }]}>
                Light Mode
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setMode('dark')}
              style={({ pressed }) => [
                styles.themeOption,
                mode === 'dark' && styles.themeOptionActive,
                pressed && styles.optionPressed,
                { backgroundColor: mode === 'dark' ? theme.accent : theme.backgroundSelected },
              ]}>
              <ThemedText type="body" style={mode === 'dark' ? styles.themeTextActive : [styles.themeText, { color: theme.text }]}>
                Dark Mode
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
          <View style={styles.fieldHeader}>
            <ThemedText type="subtitle">General</ThemedText>
            <SymbolView name="slider.horizontal.3" tintColor={theme.accent} size={20} />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}> 
            <ThemedText type="body">Notifications</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Manage alerts later</ThemedText>
          </View>
          <View style={[styles.settingItem, { borderBottomColor: theme.border }]}> 
            <ThemedText type="body">Privacy</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Account access settings</ThemedText>
          </View>
          <View style={styles.settingItem}> 
            <ThemedText type="body">Support</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Get help when you need it</ThemedText>
          </View>
        </ThemedView>
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
  subtitle: {
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    borderWidth: 1,
    gap: Spacing.three,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 3,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    marginTop: Spacing.two,
  },
  input: {
    marginTop: Spacing.two,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  gradeOption: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
  },
  gradeOptionActive: {
  },
  gradeText: {
  },
  gradeTextActive: {
    color: '#FFF',
  },
  themeRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  themeOption: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  themeOptionActive: {
  },
  themeText: {
  },
  themeTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  optionPressed: {
    opacity: 0.85,
  },
  settingItem: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    gap: Spacing.one,
  },
});
