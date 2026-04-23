import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Session } from '../../types';
import { getSessions, setStoredApiKey, getStoredApiKey } from '../../lib/storage';
import { analyzeLogic } from '../../lib/gemini';
import SessionRow from '../../components/SessionRow';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

export default function ConsoleScreen() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [apiKeyModal, setApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, []),
  );

  async function loadSessions() {
    const stored = await getSessions();
    setSessions(stored.slice(0, 5));
  }

  function startPulse() {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    pulseLoop.current.start();
  }

  function stopPulse() {
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
  }

  async function handleAnalyze() {
    if (input.trim().length < 20) return;

    // Check for API key
    const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    const storedKey = await getStoredApiKey();
    if (
      (!envKey || envKey === 'your_gemini_api_key_here') &&
      !storedKey
    ) {
      setApiKeyModal(true);
      return;
    }

    setLoading(true);
    startPulse();

    try {
      const result = await analyzeLogic(input);
      const session: Session = {
        id: Date.now().toString(),
        title: result.sessionTitle || input.split(' ').slice(0, 5).join(' ') + ' —',
        timestamp: Date.now(),
        logicScore: result.logicScore,
        userInput: input,
        result,
      };

      router.push({
        pathname: '/analysis',
        params: { sessionData: JSON.stringify(session) },
      });
    } catch (err: any) {
      if (err?.message === 'NO_API_KEY') {
        setApiKeyModal(true);
      } else {
        Alert.alert('Analysis Failed', 'Could not connect to AI. Check your API key and try again.');
      }
    } finally {
      setLoading(false);
      stopPulse();
    }
  }

  async function handleSaveApiKey() {
    if (apiKeyInput.trim().length < 10) return;
    await setStoredApiKey(apiKeyInput.trim());
    setApiKeyModal(false);
    setApiKeyInput('');
    handleAnalyze();
  }

  const canAnalyze = input.trim().length >= 20 && !loading;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Greeting */}
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <View style={styles.separator} />

          {/* Input Card */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Describe your reasoning as if explaining to an interviewer..."
              placeholderTextColor={Colors.textMuted}
              value={input}
              onChangeText={setInput}
              textAlignVertical="top"
            />
          </View>

          {/* Analyze Button */}
          <TouchableOpacity
            style={[styles.analyzeBtn, !canAnalyze && styles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            activeOpacity={0.85}
          >
            {loading ? (
              <Animated.Text style={[styles.analyzeBtnText, { opacity: pulseAnim }]}>
                {'  '}⌛ ANALYZING...
              </Animated.Text>
            ) : (
              <Text style={[styles.analyzeBtnText, !canAnalyze && styles.analyzeBtnTextDisabled]}>
                {'  '}›_ ANALYZE LOGIC
              </Text>
            )}
          </TouchableOpacity>

          {/* Recent Sessions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>⏱</Text>
            <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
          </View>

          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions yet. Analyze your first approach above.</Text>
          ) : (
            sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                onPress={() =>
                  router.push({
                    pathname: '/analysis',
                    params: { sessionData: JSON.stringify(session) },
                  })
                }
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* API Key Modal */}
      <Modal visible={apiKeyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>GEMINI API KEY</Text>
            <Text style={styles.modalSubtitle}>
              Enter your Google Gemini API key to enable AI analysis.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="AIza..."
              placeholderTextColor={Colors.textMuted}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              secureTextEntry
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleSaveApiKey}>
              <Text style={styles.modalBtnText}>SAVE & CONTINUE</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setApiKeyModal(false)} style={{ marginTop: 12 }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginBottom: 12,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    marginBottom: 14,
  },
  input: {
    color: Colors.textPrimary,
    fontSize: 15,
    padding: 16,
    minHeight: 160,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    lineHeight: 22,
  },
  analyzeBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderRadius: 0,
  },
  analyzeBtnDisabled: {
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analyzeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  analyzeBtnTextDisabled: {
    color: Colors.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionIcon: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000CC',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: 28,
    paddingBottom: Platform.OS === 'ios' ? 48 : 28,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 19,
  },
  modalInput: {
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    color: Colors.textPrimary,
    padding: 14,
    fontSize: 14,
    marginBottom: 16,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  modalBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  modalCancel: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 13,
  },
});
