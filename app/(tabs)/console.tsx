import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { analyzeLogic } from '../../lib/claude';
import { getApiKeyOverride, getSessions, setApiKeyOverride } from '../../lib/storage';
import { CTA_STYLE, FONT_MONO, LABEL_STYLE } from '../../lib/ui';
import SessionRow from '../../components/SessionRow';
import type { Session } from '../../types';

function MicIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Z"
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Path
        d="M19 11a7 7 0 0 1-14 0"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M12 18v3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M8 21h8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 18) return 'Good afternoon.';
  return 'Good evening.';
}

function scoreDot(score: number) {
  if (score >= 75) return COLORS.accent;
  if (score >= 50) return COLORS.warning;
  return COLORS.error;
}

function hasWebSpeech(): boolean {
  if (Platform.OS !== 'web') return false;
  const w = globalThis as any;
  return Boolean(w?.SpeechRecognition || w?.webkitSpeechRecognition);
}

export default function ConsoleScreen() {
  const [input, setInput] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const pulse = useRef(new Animated.Value(1)).current;
  const [speechActive, setSpeechActive] = useState(false);
  const speechRef = useRef<any>(null);

  const canAnalyze = input.trim().length >= 20 && !loading;
  const greeting = useMemo(getGreeting, []);

  const loadSessions = useCallback(async () => {
    const s = await getSessions();
    setSessions(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  useEffect(() => {
    if (!loading) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [loading, pulse]);

  useEffect(() => {
    (async () => {
      const existing = await getApiKeyOverride();
      if (existing) setApiKeyDraft(existing);
    })();
  }, []);

  const openKeyModal = () => setApiModalOpen(true);
  const isKeyConfigError = (message: string) =>
    message.includes('MISSING_API_KEY') ||
    message.includes('GEMINI_HTTP_400') ||
    message.includes('GEMINI_HTTP_401') ||
    message.includes('GEMINI_HTTP_403') ||
    message.includes('GEMINI_HTTP_404');

  const saveKey = async () => {
    if (!apiKeyDraft.trim()) return;
    await setApiKeyOverride(apiKeyDraft.trim());
    setApiModalOpen(false);
  };

  const startSpeech = () => {
    if (!hasWebSpeech() || speechActive) return;
    const w = globalThis as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0]?.transcript ?? '')
        .join('');
      setInput((prev) => (prev ? `${prev} ${transcript}`.trim() : transcript.trim()));
    };
    rec.onerror = () => {
      setSpeechActive(false);
      speechRef.current = null;
      Alert.alert('Voice not available', 'Voice transcription failed. Try typing instead.');
    };
    rec.onend = () => {
      setSpeechActive(false);
      speechRef.current = null;
    };
    speechRef.current = rec;
    setSpeechActive(true);
    rec.start();
  };

  const onAnalyze = async () => {
    if (!canAnalyze) return;
    setLoading(true);
    try {
      const result = await analyzeLogic(input.trim());
      router.push({
        pathname: '/analysis',
        params: { payload: JSON.stringify({ userInput: input.trim(), result }) },
      });
      setInput('');
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (isKeyConfigError(msg)) {
        openKeyModal();
      } else {
        Alert.alert('Analysis failed', 'Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.greeting}>{greeting}</Text>
        <View style={styles.sep} />

        <View style={styles.inputWrap}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Describe your reasoning as if explaining to an interviewer..."
            placeholderTextColor={COLORS.textSecondary}
            multiline
            style={styles.input}
            textAlignVertical="top"
          />
          {hasWebSpeech() ? (
            <Pressable
              onPress={startSpeech}
              style={[styles.micBtn, speechActive && styles.micBtnActive]}
              hitSlop={10}
            >
              <MicIcon color={speechActive ? '#000000' : COLORS.accent} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={onAnalyze}
          style={[styles.analyzeBtn, !canAnalyze && styles.analyzeBtnDisabled]}
          disabled={!canAnalyze}
        >
          <Animated.Text style={[styles.analyzeText, loading && { opacity: pulse }]}>
            {loading ? '>_ ANALYZING...' : '>_ ANALYZE LOGIC'}
          </Animated.Text>
        </Pressable>

        <Text style={styles.sectionLabel}>⏱ RECENT SESSIONS</Text>
        {sessions.length === 0 ? (
          <Text style={styles.empty}>No sessions yet. Run your first analysis.</Text>
        ) : (
          sessions.map((s) => (
            <SessionRow
              key={s.id}
              title={s.title}
              timestamp={s.timestamp}
              dotColor={scoreDot(s.logicScore)}
              onPress={() => router.push({ pathname: '/analysis', params: { id: s.id } })}
            />
          ))
        )}

        <View style={{ height: 18 }} />
      </ScrollView>

      <Modal visible={apiModalOpen} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalLabel}>API KEY REQUIRED</Text>
            <Text style={styles.modalBody}>
              Paste your Gemini key to enable analysis + interview mode.
            </Text>
            <TextInput
              value={apiKeyDraft}
              onChangeText={setApiKeyDraft}
              placeholder="AIza..."
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.keyInput}
            />
            <View style={styles.modalRow}>
              <Pressable
                onPress={() => setApiModalOpen(false)}
                style={[styles.modalBtn, styles.modalBtnGhost]}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnTextGhost]}>CANCEL</Text>
              </Pressable>
              <Pressable onPress={saveKey} style={[styles.modalBtn, styles.modalBtnSolid]}>
                <Text style={[styles.modalBtnText, styles.modalBtnTextSolid]}>SAVE</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  greeting: {
    color: COLORS.textSecondary,
    fontFamily: FONT_MONO,
    fontSize: 14,
  },
  sep: { height: 1, backgroundColor: COLORS.border, marginTop: 12, marginBottom: 16 },
  inputWrap: {
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  input: {
    minHeight: 160,
    maxHeight: 320,
    padding: 14,
    paddingRight: 48,
    color: COLORS.textPrimary,
    fontFamily: FONT_MONO,
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 4,
  },
  micBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  micBtnActive: {
    backgroundColor: COLORS.accent,
  },
  analyzeBtn: {
    marginTop: 14,
    width: '100%',
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeBtnDisabled: {
    opacity: 0.35,
  },
  analyzeText: {
    ...CTA_STYLE,
    color: '#000000',
    fontWeight: '800',
  },
  sectionLabel: {
    marginTop: 18,
    ...LABEL_STYLE,
    color: COLORS.textSecondary,
  },
  empty: {
    marginTop: 10,
    color: COLORS.textMuted,
    fontFamily: FONT_MONO,
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 18,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 16,
  },
  modalLabel: {
    ...LABEL_STYLE,
    color: COLORS.accent,
  },
  modalBody: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontFamily: FONT_MONO,
    fontSize: 13,
    lineHeight: 18,
  },
  keyInput: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgTertiary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontFamily: FONT_MONO,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
  },
  modalBtnGhost: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  modalBtnSolid: {
    backgroundColor: COLORS.accent,
  },
  modalBtnText: {
    ...CTA_STYLE,
    fontWeight: '800',
  },
  modalBtnTextGhost: { color: COLORS.textPrimary },
  modalBtnTextSolid: { color: '#000000' },
});

