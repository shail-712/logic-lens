import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import EdgeCaseCard from '../components/EdgeCaseCard';
import LogicStepCard from '../components/LogicStepCard';
import TestCaseRow from '../components/TestCaseRow';
import { addSession, getSessionById } from '../lib/storage';
import { FONT_MONO, LABEL_STYLE } from '../lib/ui';
import type { AnalysisResult, Session } from '../types';

function makeSessionTitle(userInput: string) {
  const words = userInput.trim().split(/\s+/).filter(Boolean);
  const first = words.slice(0, 5).join(' ');
  return words.length > 5 ? `${first} —` : first || 'Session';
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function AnalysisScreen() {
  const params = useLocalSearchParams<{ payload?: string; id?: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayScore, setDisplayScore] = useState(0);
  const dotPulse = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  const result: AnalysisResult | null = session?.result ?? null;

  const problemName = useMemo(() => {
    const t = result?.sessionTitle || session?.title || 'ANALYSIS';
    return t.toUpperCase();
  }, [result?.sessionTitle, session?.title]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(dotPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [dotPulse]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (params.payload) {
          const parsed = JSON.parse(String(params.payload)) as {
            userInput: string;
            result: AnalysisResult;
          };
          const now = Date.now();
          const s: Session = {
            id: makeId(),
            title: makeSessionTitle(parsed.userInput),
            timestamp: now,
            logicScore: parsed.result.logicScore,
            userInput: parsed.userInput,
            result: parsed.result,
          };
          await addSession(s);
          if (!mounted) return;
          setSession(s);
        } else if (params.id) {
          const s = await getSessionById(String(params.id));
          if (!mounted) return;
          setSession(s);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.id, params.payload]);

  useEffect(() => {
    if (!result) return;
    scoreAnim.setValue(0);
    barAnim.setValue(0);
    setDisplayScore(0);
    const sub = scoreAnim.addListener(({ value }) => setDisplayScore(Math.round(value)));
    Animated.timing(scoreAnim, {
      toValue: result.logicScore,
      duration: 800,
      useNativeDriver: false,
    }).start();
    Animated.timing(barAnim, {
      toValue: result.logicScore,
      duration: 600,
      useNativeDriver: false,
    }).start();
    return () => scoreAnim.removeListener(sub);
  }, [barAnim, result, scoreAnim]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (!session || !result) {
    return (
      <View style={styles.loading}>
        <Text style={styles.missing}>Session not found.</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>BACK</Text>
        </Pressable>
      </View>
    );
  }

  const barWidth = barAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Text style={styles.backText}>{'←'}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Analysis Complete</Text>
            <Animated.View style={{ opacity: dotPulse, marginLeft: 8 }}>
              <Svg width={10} height={10} viewBox="0 0 10 10">
                <Circle cx={5} cy={5} r={4} fill={COLORS.accent} />
              </Svg>
            </Animated.View>
          </View>
          <Text style={styles.headerSub}>{problemName}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionLabel text="LOGICAL BREAKDOWN" />
        {result.steps.map((s) => (
          <LogicStepCard
            key={s.number}
            number={s.number}
            description={s.description}
            valid={s.valid}
          />
        ))}

        <SectionLabel text="TEST CASE SIMULATION" />
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 1.2 }]}>INPUT</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>OUT</Text>
          <Text style={[styles.th, { width: 70, textAlign: 'center' }]}>STATUS</Text>
        </View>
        {result.testCases.map((tc, idx) => (
          <TestCaseRow key={`${idx}_${tc.status}`} tc={tc} />
        ))}

        <SectionLabel text="EDGE CASE DETECTION" />
        {result.edgeCases.map((e, idx) => (
          <EdgeCaseCard key={`${idx}_${e.title}`} edge={e} />
        ))}

        <SectionLabel text="INTERVIEWER NOTES" />
        <View style={styles.quote}>
          <Text style={styles.quoteText}>"{result.interviewerNote}"</Text>
          <Text style={styles.quoteBy}>— LOGICLENS INTERVIEWER</Text>
        </View>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreLabel}>LOGIC SCORE</Text>
          <Text style={styles.scoreValue}>{displayScore}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>

        <View style={{ height: 26 }} />
      </ScrollView>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionRow}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionText}>| {text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  missing: { color: COLORS.textSecondary, fontFamily: FONT_MONO },
  backBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtnText: { ...LABEL_STYLE, color: COLORS.textPrimary },
  screen: { flex: 1, backgroundColor: COLORS.bgPrimary },
  header: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  backText: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 16 },
  headerSub: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontFamily: FONT_MONO,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 10 },
  sectionBar: { width: 3, height: 14, backgroundColor: COLORS.accent },
  sectionText: {
    ...LABEL_STYLE,
    color: COLORS.textSecondary,
  },
  tableHeader: {
    marginTop: 10,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  th: {
    ...LABEL_STYLE,
    color: COLORS.textMuted,
  },
  quote: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 14,
  },
  quoteText: {
    color: COLORS.textPrimary,
    fontFamily: FONT_MONO,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '800',
    lineHeight: 20,
  },
  quoteBy: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontFamily: FONT_MONO,
    fontSize: 12,
    letterSpacing: 2,
  },
  scoreRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  scoreLabel: {
    ...LABEL_STYLE,
    color: COLORS.textSecondary,
  },
  scoreValue: {
    color: COLORS.accent,
    fontFamily: FONT_MONO,
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
  },
  progressTrack: {
    marginTop: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
  },
});

