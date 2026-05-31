// frontend/app/activity/parachute-drop.tsx
// Activity 1: Parachute Drop Challenge
// Features: expo-camera video recording, G-force calculation, GPS tag, SQLite save

import { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { toast } from 'sonner-native';

import { useTheme } from '@/hooks/use-theme';
import { useAppContext } from '@/context/AppContext';
import StyledButton from '@/components/ui/StyledButton';
import {
  calculateGForce,
  interpretGForce,
  saveParachuteResult,
} from '@/backend/services/parachuteService';

const COLOR = '#3D5CFF';

// ── Reusable sub-components ─────────────────────────────────────────────────

function SectionTitle({ text, theme }: { text: string; theme: any }) {
  return (
    <Text style={[styles.sectionTitle, { color: theme.darkText }]}>{text}</Text>
  );
}

function DataRow({ label, value, unit, color, theme }: {
  label: string; value: string; unit?: string; color?: string; theme: any;
}) {
  return (
    <View style={[styles.dataRow, { backgroundColor: theme.surface }]}>
      <Text style={[styles.dataLabel, { color: theme.mutedText }]}>{label}</Text>
      <Text style={[styles.dataValue, { color: color ?? theme.darkText }]}>
        {value}{unit ? ` ${unit}` : ''}
      </Text>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────

export default function ParachuteDrop() {
  const theme = useTheme();
  const router = useRouter();
  const { team } = useAppContext();

  // Camera
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoRecorded, setVideoRecorded] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Form inputs
  const [impactSpeed, setImpactSpeed] = useState('');
  const [contactTime, setContactTime] = useState('');
  const [videoNotes, setVideoNotes] = useState('');

  // Calculated result
  const [gForce, setGForce] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Camera actions ────────────────────────────────────────────────────────

  const handleOpenCamera = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'This activity needs camera access to record your parachute drop. Please enable it in Settings.',
          [{ text: 'OK' }],
        );
        return;
      }
    }
    setShowCamera(true);
  }, [cameraPermission, requestCameraPermission]);

  const handleStartRecording = async () => {
    if (!cameraRef.current) return;
    try {
      setIsRecording(true);
      await cameraRef.current.recordAsync({ maxDuration: 30 });
    } catch (err) {
      console.warn('[Parachute] Recording error:', err);
      toast.error('Recording failed. Please try again.');
    }
  };

  const handleStopRecording = () => {
    cameraRef.current?.stopRecording();
    setIsRecording(false);
    setVideoRecorded(true);
    setShowCamera(false);
    toast.success('Video saved! Now review it in slow-motion to measure impact speed and contact time.');
  };

  // ── Physics calculation ───────────────────────────────────────────────────

  const handleCalculate = () => {
    const speed = parseFloat(impactSpeed);
    const time = parseFloat(contactTime);

    if (isNaN(speed) || isNaN(time) || speed <= 0 || time <= 0) {
      toast.error('Please enter valid positive numbers for both fields.');
      return;
    }
    if (time > 5) {
      toast.error('Contact time seems too long. Enter the value in seconds (e.g. 0.05).');
      return;
    }

    const result = calculateGForce(speed, time);
    setGForce(result);
  };

  // ── Save to SQLite ────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (gForce === null) {
      toast.error('Calculate G-force before saving.');
      return;
    }
    setIsSaving(true);
    try {
      let coords: { latitude: number; longitude: number } | undefined;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }

      saveParachuteResult(
        {
          impactSpeedMs: parseFloat(impactSpeed),
          contactTimeSec: parseFloat(contactTime),
          gForce,
          videoNotes,
          recordedAt: new Date().toISOString(),
          teamId: team?.id ?? 'unknown',
        },
        coords,
      );

      toast.success('Result saved locally! Will sync when connected.');
      // Reset form for next trial
      setImpactSpeed('');
      setContactTime('');
      setVideoNotes('');
      setGForce(null);
      setVideoRecorded(false);
    } catch (err) {
      toast.error('Failed to save. Please try again.');
      console.error('[Parachute] save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Derived UI ────────────────────────────────────────────────────────────

  const interpretation = gForce !== null ? interpretGForce(gForce) : null;

  // ── Camera view (full screen) ─────────────────────────────────────────────

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          mode="video"
        >
          <SafeAreaView style={styles.cameraOverlay}>
            {/* Top bar */}
            <View style={styles.cameraTopBar}>
              <TouchableOpacity
                style={styles.cameraCloseBtn}
                onPress={() => { setShowCamera(false); setIsRecording(false); }}
              >
                <Ionicons name="close" size={26} color="white" />
              </TouchableOpacity>
              <Text style={styles.cameraHint}>
                {isRecording ? '🔴 Recording...' : 'Position camera above drop zone'}
              </Text>
            </View>

            {/* Record button */}
            <View style={styles.cameraBottom}>
              <TouchableOpacity
                style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isRecording ? 'stop' : 'videocam'}
                  size={30}
                  color="white"
                />
              </TouchableOpacity>
              <Text style={styles.recordBtnLabel}>
                {isRecording ? 'Tap to Stop' : 'Tap to Record'}
              </Text>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLOR }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🪂  Parachute Drop</Text>
        <View style={[styles.idBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
          <Text style={styles.idText}>#1</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { backgroundColor: theme.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Record your drop in slow-motion, then measure impact speed and contact time from the video to calculate G-force on landing.
        </Text>

        {/* ── Step 1: Record Video ──────────────────────────────── */}
        <SectionTitle text="Step 1 — Record Your Drop" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.videoStatus}>
            <View style={[
              styles.statusDot,
              { backgroundColor: videoRecorded ? theme.success : theme.mutedText },
            ]} />
            <Text style={[styles.statusText, { color: videoRecorded ? theme.success : theme.mutedText }]}>
              {videoRecorded ? 'Video recorded ✓' : 'No video yet'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.cameraBtn, { borderColor: COLOR }]}
            onPress={handleOpenCamera}
            activeOpacity={0.8}
          >
            <Ionicons name="videocam-outline" size={22} color={COLOR} />
            <Text style={[styles.cameraBtnText, { color: COLOR }]}>
              {videoRecorded ? 'Record Again' : 'Open Camera'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.cameraHintText, { color: theme.mutedText }]}>
            💡 Use your phone's Photos app to replay in slow-motion and measure precise timing.
          </Text>
        </View>

        {/* ── Step 2: Enter Measurements ───────────────────────── */}
        <SectionTitle text="Step 2 — Enter Measurements" theme={theme} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.inputLabel, { color: theme.darkText }]}>
            Impact Speed (m/s)
          </Text>
          <Text style={[styles.inputHint, { color: theme.mutedText }]}>
            Measure how fast the object was moving just before landing
          </Text>
          <TextInput
            style={[styles.textInput, { borderColor: theme.border, color: theme.blackText, backgroundColor: theme.surfaceAlt }]}
            placeholder="e.g. 2.5"
            placeholderTextColor={theme.placeholderText}
            value={impactSpeed}
            onChangeText={setImpactSpeed}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.inputLabel, { color: theme.darkText, marginTop: 16 }]}>
            Contact Time (seconds)
          </Text>
          <Text style={[styles.inputHint, { color: theme.mutedText }]}>
            Time from first contact to full stop (e.g. 0.05)
          </Text>
          <TextInput
            style={[styles.textInput, { borderColor: theme.border, color: theme.blackText, backgroundColor: theme.surfaceAlt }]}
            placeholder="e.g. 0.05"
            placeholderTextColor={theme.placeholderText}
            value={contactTime}
            onChangeText={setContactTime}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.inputLabel, { color: theme.darkText, marginTop: 16 }]}>
            Video Notes (optional)
          </Text>
          <TextInput
            style={[styles.textInputMulti, { borderColor: theme.border, color: theme.blackText, backgroundColor: theme.surfaceAlt }]}
            placeholder="Observations from your slow-motion review..."
            placeholderTextColor={theme.placeholderText}
            value={videoNotes}
            onChangeText={setVideoNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.calcBtn, { backgroundColor: COLOR }]}
            onPress={handleCalculate}
            activeOpacity={0.82}
          >
            <Ionicons name="calculator-outline" size={18} color="white" />
            <Text style={styles.calcBtnText}>Calculate G-Force</Text>
          </TouchableOpacity>
        </View>

        {/* ── Step 3: Result ───────────────────────────────────── */}
        {gForce !== null && interpretation && (
          <>
            <SectionTitle text="Step 3 — Your Results" theme={theme} />
            <View style={[styles.resultCard, { backgroundColor: interpretation.color + '18', borderColor: interpretation.color }]}>
              <Text style={[styles.resultLabel, { color: interpretation.color }]}>
                {interpretation.label}
              </Text>
              <Text style={[styles.resultGForce, { color: interpretation.color }]}>
                {gForce} G
              </Text>
              <Text style={[styles.resultDescription, { color: theme.mutedText }]}>
                {interpretation.description}
              </Text>
            </View>

            <View style={{ gap: 8, marginBottom: 16 }}>
              <DataRow label="Impact Speed" value={impactSpeed} unit="m/s" theme={theme} />
              <DataRow label="Contact Time" value={contactTime} unit="s" theme={theme} />
              <DataRow
                label="G-Force"
                value={String(gForce)}
                unit="g"
                color={interpretation.color}
                theme={theme}
              />
              <DataRow
                label="Formula"
                value={`(${impactSpeed} ÷ ${contactTime}) ÷ 9.8 = ${gForce}g`}
                theme={theme}
              />
            </View>

            {/* Save */}
            <StyledButton
              onPress={handleSave}
              text="Save Result"
              width="100%"
              fontSize={16}
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
  headerTitle: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 18, color: 'white' },
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

  videoStatus: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontFamily: 'Lato_400Regular', fontSize: 14 },
  cameraBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, borderRadius: 50, borderWidth: 2,
    paddingVertical: 12, marginBottom: 12,
  },
  cameraBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15 },
  cameraHintText: { fontFamily: 'Lato_400Regular', fontSize: 12, lineHeight: 17 },

  inputLabel: { fontFamily: 'Nunito_700Bold', fontSize: 14, marginBottom: 4 },
  inputHint: { fontFamily: 'Lato_400Regular', fontSize: 12, marginBottom: 8 },
  textInput: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontFamily: 'Lato_400Regular', fontSize: 15,
  },
  textInputMulti: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontFamily: 'Lato_400Regular', fontSize: 15,
    height: 80, textAlignVertical: 'top',
  },
  calcBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 50, paddingVertical: 12, marginTop: 16,
  },
  calcBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 15, color: 'white' },

  resultCard: {
    borderRadius: 16, borderWidth: 2, padding: 20,
    alignItems: 'center', marginBottom: 14,
  },
  resultLabel: { fontFamily: 'Nunito_700Bold', fontSize: 16, marginBottom: 4 },
  resultGForce: { fontFamily: 'Nunito_700Bold', fontSize: 48, marginBottom: 8 },
  resultDescription: { fontFamily: 'Lato_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 18 },

  dataRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
  },
  dataLabel: { fontFamily: 'Lato_400Regular', fontSize: 13 },
  dataValue: { fontFamily: 'Nunito_700Bold', fontSize: 13 },

  // Camera overlay styles
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'space-between' },
  cameraTopBar: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingTop: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingBottom: 12,
  },
  cameraCloseBtn: { padding: 6 },
  cameraHint: { flex: 1, color: 'white', fontFamily: 'Lato_400Regular', fontSize: 14 },
  cameraBottom: {
    alignItems: 'center', paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingTop: 20,
  },
  recordBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#EF4444',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: 'white',
  },
  recordBtnActive: { backgroundColor: '#7C3AED' },
  recordBtnLabel: {
    color: 'white', fontFamily: 'Lato_400Regular',
    fontSize: 13, marginTop: 10,
  },
});
