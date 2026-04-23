import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Session } from '../../types';
import { getSessions } from '../../lib/storage';
import { PROBLEMS } from '../../lib/problems';
import CircularTimer from '../../components/CircularTimer';

const TOTAL_SECONDS = 25 * 60;

interface PastResult {
  title: string;
  duration: string;
  score: number;
}

function AnimatedBar({ value, color }: { value: number; color: string }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: value, duration: 700, useNativeDriver: false }).start();
  }, []);
  return (
    <View style={styles.barTrack}>
      <Animated.View
        style={[
          styles.barFill,
          {
            backgroundColor: color,
            width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

export default function PracticeScreen() {
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [running, setRunning] = useState(false);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(4); // Sliding Window default
  const [focusModal, setFocusModal] = useState(false);
  const [pastResults, setPastResults] = useState<PastResult[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPastResults();
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, []),
  );

  async function loadPastResults() {
    const sessions = await getSessions();
    const results = sessions.slice(0, 5).map((s: Session) => ({
      title: s.title,
      duration: '—',
      score: s.logicScore,
    }));
    setPastResults(results);
  }

  function handleBeginSession() {
    if (running) {
      // Pause
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
      return;
    }
    setRunning(true);
    setRemaining((prev) => (prev === 0 ? TOTAL_SECONDS : prev));
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          Alert.alert('Session Complete', 'Great work! Your 25-minute session has ended.', [
            { text: 'OK', onPress: () => setRemaining(TOTAL_SECONDS) },
          ]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const currentProblem = PROBLEMS[currentProblemIdx];
  const difficultyColor = currentProblem.difficulty === 'Hard' ? Colors.error : currentProblem.difficulty === 'Medium' ? Colors.warning : Colors.accent;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Practice Mode</Text>
          <TouchableOpacity style={styles.focusBtn} onPress={() => setFocusModal(true)}>
            <Text style={styles.focusBtnText}>+ Focus</Text>
          </TouchableOpacity>
        </View>

        {/* Circular Timer */}
        <View style={styles.timerContainer}>
          <CircularTimer totalSeconds={TOTAL_SECONDS} remainingSeconds={remaining} size={220} />
        </View>

        {/* Problem Card */}
        <View style={styles.problemCard}>
          <View style={styles.problemHeader}>
            <View style={[styles.difficultyBadge, { borderColor: difficultyColor }]}>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                {currentProblem.difficulty}
              </Text>
            </View>
            <Text style={styles.problemTitle}>{currentProblem.title}</Text>
          </View>

          <TouchableOpacity
            style={[styles.beginBtn, running && styles.beginBtnActive]}
            onPress={handleBeginSession}
            activeOpacity={0.85}
          >
            <Text style={styles.beginBtnIcon}>{running ? '⏸' : '▷'}</Text>
            <Text style={styles.beginBtnText}>{running ? 'Pause Session' : 'Begin Session'}</Text>
          </TouchableOpacity>
        </View>

        {/* Previous Results */}
        <Text style={styles.sectionLabel}>Previous Results</Text>
        {pastResults.length === 0 ? (
          <Text style={styles.emptyText}>Complete your first session to see results here.</Text>
        ) : (
          pastResults.map((r, i) => (
            <View key={i} style={styles.resultRow}>
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={1}>{r.title}</Text>
                <AnimatedBar value={r.score} color={Colors.accent} />
              </View>
              <Text style={styles.resultScore}>{r.score}%</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Focus Modal */}
      <Modal visible={focusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SELECT PROBLEM</Text>
            <ScrollView>
              {PROBLEMS.map((p, i) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.problemOption, i === currentProblemIdx && styles.problemOptionActive]}
                  onPress={() => {
                    setCurrentProblemIdx(i);
                    setRemaining(TOTAL_SECONDS);
                    setRunning(false);
                    if (intervalRef.current) clearInterval(intervalRef.current);
                    setFocusModal(false);
                  }}
                >
                  <Text style={styles.problemOptionTitle}>{p.title}</Text>
                  <Text style={[styles.problemOptionDiff, {
                    color: p.difficulty === 'Hard' ? Colors.error : p.difficulty === 'Medium' ? Colors.warning : Colors.accent,
                  }]}>{p.difficulty}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setFocusModal(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>CLOSE</Text>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 50,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  focusBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
  },
  focusBtnText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  problemCard: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 16,
    marginBottom: 32,
    gap: 16,
  },
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  difficultyBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  problemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  beginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: 14,
    gap: 10,
    borderRadius: 0,
  },
  beginBtnActive: {
    borderColor: Colors.warning,
  },
  beginBtnIcon: {
    fontSize: 16,
    color: Colors.accent,
  },
  beginBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  sectionLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    lineHeight: 20,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  resultInfo: {
    flex: 1,
    gap: 6,
  },
  resultTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  resultScore: {
    fontSize: 15,
    color: Colors.accent,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  barTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
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
    padding: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
  },
  modalTitle: {
    fontSize: 13,
    color: Colors.accent,
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
    marginBottom: 20,
  },
  problemOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  problemOptionActive: {
    backgroundColor: Colors.bgTertiary,
  },
  problemOptionTitle: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  problemOptionDiff: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  modalClose: {
    marginTop: 20,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCloseText: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
});
