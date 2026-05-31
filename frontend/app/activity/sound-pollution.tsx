// frontend/app/activity/sound-pollution.tsx
// Activity 2: Sound Pollution Hunter
// Features: expo-av microphone, live dB meter, classroom action logging, SQLite save

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import * as Location from 'expo-location';
import { toast } from 'sonner-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { useAppContext } from '@/context/AppContext';
import StyledButton from '@/components/ui/StyledButton';
import {
  CLASSROOM_ACTIONS, ClassroomAction,
  meteringToDb, interpretDb,
  calculatePeakDb, calculateAverageDb,
  saveSoundResult, SoundReading,
} from '@/backend/services/soundPollutionService';

const COLOR = '#6A1B9A';
const METER_UPDATE_MS = 200;

// ── dB Meter bar ────────────────────────────────────────────────────────────

function DbMeter({ db, theme }: { db: number; theme: any }) {
  const interp = interpretDb(db);
  const pct = Math.min(100, (db / 120) * 100);

  return (
    <View style={meterStyles.container}>
      <View style={[meterStyles.barBg, { backgroundColor: theme.border }]}>
        <View
          style={[
            meterStyles.barFill,
            { width: `${pct}%` as any, backgroundColor: interp.color },
          ]}
        />
      </View>
      <View style={meterStyles.labels}>
        <Text style={[meterStyles.dbValue, { color: interp.color }]}>{db} dB</Text>
        <Text style={[meterStyles.dbLabel, { color: interp.color }]}>{interp.label}</Text>
      </View>
      <Text style={[meterStyles.dbDesc, { color: theme.mutedText }]}>{interp.description}</Text>
    </View>
  );
}

const meterStyles = StyleSheet.create({
  container: { marginBottom: 4 },
  barBg: { height: 18, borderRadius: 9, overflow: 'hidden', marginBottom: 8 },
  barFill: { height: '100%', borderRadius: 9 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dbValue: { fontFamily: 'Nunito_700Bold', fontSize: 22 },
  dbLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, alignSelf: 'flex-end' },
  dbDesc: { fontFamily: 'Lato_400Regular', fontSize: 12, lineHeight: 17 },
});

// ── Main Screen ─────────────────────────────────────────────────────────────

export default function SoundPollution() {
  const theme = useAppTheme();
  const router = useRouter();
  const { team } = useAppContext();

  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [liveDb, setLiveDb] = useState(0);
  const [selectedAction, setSelectedAction] = useState<ClassroomAction>(CLASSROOM_ACTIONS[0]);
  const [locationLabel, setLocationLabel] = useState('');
  const [readings, setReadings] = useState<SoundReading[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [actionPickerOpen, setActionPickerOpen] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Request mic permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasMicPermission(status === 'granted');
    })();
    return () => stopListening();
  }, []);

  // ── Start/stop listening ────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    if (!hasMicPermission) {
      Alert.alert(
        'Microphone Required',
        'This activity needs microphone access to measure sound levels. Enable it in Settings.',
      );
      return;
    }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        undefined,
        METER_UPDATE_MS,
      );
      recordingRef.current = recording;
      setIsListening(true);

      // Poll metering every METER_UPDATE_MS
      intervalRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording && status.metering !== undefined) {
          setLiveDb(meteringToDb(status.metering));
        }
      }, METER_UPDATE_MS);
    } catch (err) {
      console.error('[Sound] startListening error:', err);
      toast.error('Could not access microphone. Check permissions.');
    }
  }, [hasMicPermission]);

  const stopListening = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch { /* already stopped */ }
      recordingRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ── Log a reading ────────────────────────────────────────────────────────

  const logReading = () => {
    if (!isListening) {
      toast.error('Start the microphone first.');
      return;
    }
    const reading: SoundReading = {
      dbLevel: liveDb,
      action: selectedAction,
      timestamp: new Date().toISOString(),
    };
    setReadings((prev) => [...prev, reading]);
    toast.success(`Logged: ${liveDb} dB — ${selectedAction}`);
  };

  // ── Save to SQLite ────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (readings.length === 0) {
      toast.error('Log at least one reading before saving.');
      return;
    }
    setIsSaving(true);
    await stopListening();
    try {
      let coords: { latitude: number; longitude: number } | undefined;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }

      saveSoundResult(
        {
          readings,
          locationLabel: locationLabel || 'Unspecified location',
          peakDb: calculatePeakDb(readings),
          averageDb: calculateAverageDb(readings),
          teamId: team?.id ?? 'unknown',
          recordedAt: new Date().toISOString(),
        },
        coords,
      );

      toast.success(`${readings.length} reading(s) saved!`);
      setReadings([]);
      setLiveDb(0);
      setLocationLabel('');
    } catch (err) {
      toast.error('Save failed. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const peakDb = calculatePeakDb(readings);
  const avgDb = calculateAverageDb(readings);

  // ── UI ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLOR }]}>
        <TouchableOpacity onPress={() => { stopListening(); router.back(); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔊  Sound Pollution Hunter</Text>
        <View style={[styles.idBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={styles.idText}>#2</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { backgroundColor: theme.background }]}
      >
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Measure real-time sound levels using your microphone. Log each classroom action and compare dB readings across environments.
        </Text>

        {/* Permission warning */}
        {hasMicPermission === false && (
          <View style={[styles.warningCard, { backgroundColor: '#EF444418', borderColor: '#EF4444' }]}>
            <Ionicons name="warning-outline" size={20} color="#EF4444" />
            <Text style={[styles.warningText, { color: '#EF4444' }]}>
              Microphone permission denied. Go to Settings → STEMM Lab → Microphone to enable it.
            </Text>
          </View>
        )}

        {/* ── Live Meter ──────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: theme.darkText }]}>Live Sound Level</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <DbMeter db={liveDb} theme={theme} />

          <View style={styles.micBtnRow}>
            <TouchableOpacity
              style={[
                styles.micBtn,
                { backgroundColor: isListening ? '#EF4444' : COLOR },
              ]}
              onPress={isListening ? stopListening : startListening}
              activeOpacity={0.82}
            >
              <Ionicons
                name={isListening ? 'mic-off' : 'mic'}
                size={22}
                color="white"
              />
              <Text style={styles.micBtnText}>
                {isListening ? 'Stop Mic' : 'Start Mic'}
              </Text>
            </TouchableOpacity>

            {isListening && (
              <View style={[styles.liveIndicator, { borderColor: '#EF4444' }]}>
                <View style={[styles.liveDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.liveText, { color: '#EF4444' }]}>LIVE</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Log a Reading ───────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: theme.darkText }]}>Log a Reading</Text>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.inputLabel, { color: theme.darkText }]}>Classroom Action</Text>
          <TouchableOpacity
            style={[styles.picker, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}
            onPress={() => setActionPickerOpen((o) => !o)}
            activeOpacity={0.8}
          >
            <Ionicons name="list-outline" size={18} color={COLOR} />
            <Text style={[styles.pickerText, { color: theme.blackText }]}>{selectedAction}</Text>
            <Ionicons name={actionPickerOpen ? 'chevron-up' : 'chevron-down'} size={16} color={theme.mutedText} />
          </TouchableOpacity>

          {actionPickerOpen && (
            <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {CLASSROOM_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action}
                  style={[
                    styles.dropItem,
                    { borderBottomColor: theme.divider },
                    selectedAction === action && { backgroundColor: COLOR + '14' },
                  ]}
                  onPress={() => { setSelectedAction(action); setActionPickerOpen(false); }}
                >
                  <Text style={[
                    styles.dropText,
                    { color: theme.blackText },
                    selectedAction === action && { color: COLOR, fontFamily: 'Nunito_700Bold' },
                  ]}>
                    {action}
                  </Text>
                  {selectedAction === action && <Ionicons name="checkmark" size={16} color={COLOR} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: COLOR, marginTop: 14 }]}
            onPress={logReading}
            activeOpacity={0.82}
          >
            <Ionicons name="add-circle-outline" size={18} color="white" />
            <Text style={styles.logBtnText}>Log {liveDb} dB — {selectedAction}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Readings Log ─────────────────────────────────────── */}
        {readings.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.darkText }]}>
              Readings ({readings.length})
            </Text>

            {/* Summary stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.statNum, { color: '#EF4444' }]}>{peakDb}</Text>
                <Text style={[styles.statLabel, { color: theme.mutedText }]}>Peak dB</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.statNum, { color: COLOR }]}>{avgDb}</Text>
                <Text style={[styles.statLabel, { color: theme.mutedText }]}>Avg dB</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.statNum, { color: theme.darkText }]}>{readings.length}</Text>
                <Text style={[styles.statLabel, { color: theme.mutedText }]}>Logged</Text>
              </View>
            </View>

            {readings.map((r, i) => {
              const interp = interpretDb(r.dbLevel);
              return (
                <View key={i} style={[styles.readingRow, { backgroundColor: theme.surface }]}>
                  <View style={[styles.readingDot, { backgroundColor: interp.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.readingAction, { color: theme.darkText }]}>{r.action}</Text>
                    <Text style={[styles.readingTime, { color: theme.mutedText }]}>
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={[styles.readingDb, { color: interp.color }]}>{r.dbLevel} dB</Text>
                </View>
              );
            })}

            <StyledButton
              onPress={handleSave}
              text="Save All Readings"
              width="100%"
              fontSize={16}
              marginTop={16}
              marginBottom={32}
              isLoading={isSaving}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 17, color: 'white' },
  idBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  idText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'white' },
  scroll: { padding: 18, paddingBottom: 60 },
  subtitle: { fontFamily: 'Lato_400Regular', fontSize: 14, lineHeight: 20, marginBottom: 20 },
  sectionTitle: { fontFamily: 'Nunito_700Bold', fontSize: 16, marginBottom: 10, marginTop: 6 },
  card: {
    borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  warningCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1.5, padding: 14, marginBottom: 16,
  },
  warningText: { flex: 1, fontFamily: 'Lato_400Regular', fontSize: 13, lineHeight: 18 },
  micBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  micBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 50, paddingVertical: 11, paddingHorizontal: 20,
  },
  micBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: 'white' },
  liveIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  inputLabel: { fontFamily: 'Nunito_700Bold', fontSize: 14, marginBottom: 8 },
  picker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 10, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  pickerText: { flex: 1, fontFamily: 'Lato_400Regular', fontSize: 15 },
  dropdown: {
    borderRadius: 10, borderWidth: 1.5, overflow: 'hidden', marginTop: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  dropItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropText: { fontFamily: 'Lato_400Regular', fontSize: 15 },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 50, paddingVertical: 12,
  },
  logBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14, color: 'white' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statNum: { fontFamily: 'Nunito_700Bold', fontSize: 22 },
  statLabel: { fontFamily: 'Lato_400Regular', fontSize: 11, marginTop: 2 },
  readingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 8,
  },
  readingDot: { width: 12, height: 12, borderRadius: 6 },
  readingAction: { fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  readingTime: { fontFamily: 'Lato_400Regular', fontSize: 11, marginTop: 1 },
  readingDb: { fontFamily: 'Nunito_700Bold', fontSize: 16 },
});
