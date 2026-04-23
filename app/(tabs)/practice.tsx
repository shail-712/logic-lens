import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import CircularTimer from '../../components/CircularTimer';
import { COLORS } from '../../constants/colors';
import { PROBLEMS } from '../../lib/problems';
import { getSessions } from '../../lib/storage';
import { CTA_STYLE, FONT_MONO, LABEL_STYLE } from '../../lib/ui';
import type { Problem, Session } from '../../types';

const TOTAL_SECONDS = 25 * 60;

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const width = `${Math.max(0, Math.min(1, pct)) * 100}%` as any;
  return (
    <View style={styles.pbTrack}>
      <View style={[styles.pbFill, { width, backgroundColor: color }]} />
    </View>
  );
}

export default function PracticeScreen() {
  const [problem, setProblem] = useState<Problem>(PROBLEMS[4]);
  const [focusOpen, setFocusOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<any>(null);
  const [history, setHistory] = useState<Session[]>([]);

  const loadHistory = useCallback(async () => {
    const s = await getSessions();
    setHistory(s);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running]);

  useEffect(() => {
    if (running && secondsLeft === 0) {
      setRunning(false);
      Alert.alert('Session Complete', 'Timer reached 0.');
      setSecondsLeft(TOTAL_SECONDS);
    }
  }, [running, secondsLeft]);

  const begin = () => {
    setSecondsLeft(TOTAL_SECONDS);
    setRunning(true);
  };

  const recent = useMemo(() => history.slice(0, 6), [history]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Practice Mode</Text>
          <Pressable onPress={() => setFocusOpen(true)} style={styles.focusBtn}>
            <Text style={styles.focusText}>+ FOCUS</Text>
          </Pressable>
        </View>

        <CircularTimer secondsLeft={secondsLeft} totalSeconds={TOTAL_SECONDS} />

        <View style={styles.problemCard}>
          <View style={styles.problemTop}>
            <View style={styles.diffPill}>
              <Text style={styles.diffText}>{problem.difficulty}</Text>
            </View>
            <Text style={styles.problemTitle}>{problem.title}</Text>
          </View>
          <Pressable
            onPress={begin}
            disabled={running}
            style={[styles.beginBtn, running && { opacity: 0.5 }]}
          >
            <Text style={styles.beginText}>▷ BEGIN SESSION</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>PREVIOUS RESULTS</Text>
        {recent.length === 0 ? (
          <Text style={styles.empty}>No results yet.</Text>
        ) : (
          recent.map((s) => (
            <View key={s.id} style={styles.resultCard}>
              <View style={styles.resultRow}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {s.result.sessionTitle || s.title}
                </Text>
                <Text style={styles.resultMeta}>{Math.round(s.logicScore)}%</Text>
              </View>
              <Text style={styles.resultSub}>
                {new Date(s.timestamp).toLocaleString()} • {problem.category}
              </Text>
              <ProgressBar pct={s.logicScore / 100} color={COLORS.accent} />
            </View>
          ))
        )}

        <View style={{ height: 26 }} />
      </ScrollView>

      <Modal visible={focusOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalLabel}>PICK A PROBLEM</Text>
            <ScrollView style={{ maxHeight: 380 }}>
              {PROBLEMS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setProblem(p);
                    setFocusOpen(false);
                  }}
                  style={styles.problemPick}
                >
                  <Text style={styles.pickTitle}>{p.title}</Text>
                  <Text style={styles.pickSub}>
                    {p.difficulty.toUpperCase()} • {p.category.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setFocusOpen(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>CLOSE</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 22, fontWeight: '800' },
  focusBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  focusText: { ...LABEL_STYLE, color: COLORS.textPrimary },
  problemCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 14,
  },
  problemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  diffPill: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  diffText: { ...LABEL_STYLE, color: '#000000', fontWeight: '900' },
  problemTitle: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 16 },
  beginBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgTertiary,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  },
  beginText: { ...CTA_STYLE, color: COLORS.textPrimary, fontWeight: '800' },
  section: { marginTop: 18, ...LABEL_STYLE, color: COLORS.textSecondary },
  empty: { marginTop: 10, color: COLORS.textMuted, fontFamily: FONT_MONO, fontSize: 12 },
  resultCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 12,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultTitle: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 14 },
  resultMeta: { color: COLORS.accent, fontFamily: FONT_MONO, fontSize: 14, fontWeight: '900' },
  resultSub: { marginTop: 6, color: COLORS.textSecondary, fontFamily: FONT_MONO, fontSize: 12 },
  pbTrack: {
    marginTop: 10,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pbFill: { height: '100%' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: 18,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 14,
  },
  modalLabel: { ...LABEL_STYLE, color: COLORS.accent },
  problemPick: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgTertiary,
    padding: 12,
  },
  pickTitle: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 14 },
  pickSub: { marginTop: 4, ...LABEL_STYLE, color: COLORS.textSecondary },
  modalClose: {
    marginTop: 12,
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: { ...CTA_STYLE, color: '#000000', fontWeight: '900' },
});

