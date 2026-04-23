import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScoreChart from '../../components/ScoreChart';
import { COLORS } from '../../constants/colors';
import { getSessions, getUsername } from '../../lib/storage';
import { FONT_MONO, LABEL_STYLE } from '../../lib/ui';
import type { Session } from '../../types';

function avg(nums: number[]) {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function bestStreak(scores: number[], threshold: number) {
  let best = 0;
  let cur = 0;
  for (const s of scores) {
    if (s >= threshold) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  }
  return best;
}

function edgeAreaFromTitle(title: string): 'Boundary Conditions' | 'Time Complexity' | 'Recursive Base Cases' {
  const t = title.toUpperCase();
  if (t.includes('TIME') || t.includes('COMPLEX') || t.includes('PERFORMANCE')) return 'Time Complexity';
  if (t.includes('RECUR') || t.includes('BASE CASE')) return 'Recursive Base Cases';
  return 'Boundary Conditions';
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function FocusRow({ label, pct }: { label: string; pct: number }) {
  const w = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    w.setValue(0);
    Animated.timing(w, { toValue: pct, duration: 600, useNativeDriver: false }).start();
  }, [pct, w]);
  const width = w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={styles.focusRow}>
      <View style={styles.focusTop}>
        <Text style={styles.focusLabel}>{label}</Text>
        <Text style={styles.focusPct}>{Math.round(pct * 100)}%</Text>
      </View>
      <View style={styles.focusTrack}>
        <Animated.View style={[styles.focusFill, { width }]} />
      </View>
    </View>
  );
}

export default function OperatorScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [username, setUsername] = useState('OPERATOR_01');

  const load = useCallback(async () => {
    const [s, u] = await Promise.all([getSessions(), getUsername()]);
    setSessions(s);
    setUsername(u);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const scores = useMemo(() => sessions.map((s) => s.logicScore), [sessions]);
  const last10 = useMemo(() => sessions.slice(0, 10).reverse().map((s) => s.logicScore), [sessions]);
  const avgScore = useMemo(() => Math.round(avg(scores)), [scores]);
  const accuracy = useMemo(() => (sessions.length ? Math.round(avgScore) : 0), [avgScore, sessions.length]);

  const edgeTotal = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.result.edgeCases?.length ?? 0), 0),
    [sessions]
  );

  const streak = useMemo(() => bestStreak(scores, 75), [scores]);

  const focus = useMemo(() => {
    const counts: Record<string, number> = {
      'Boundary Conditions': 0,
      'Time Complexity': 0,
      'Recursive Base Cases': 0,
    };
    for (const s of sessions) {
      for (const e of s.result.edgeCases ?? []) {
        const area = edgeAreaFromTitle(e.title);
        counts[area] += 1;
      }
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return {
      boundary: counts['Boundary Conditions'] / total,
      time: counts['Time Complexity'] / total,
      recur: counts['Recursive Base Cases'] / total,
    };
  }, [sessions]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scroll}>
      <View style={styles.userRow}>
        <View style={styles.avatar} />
        <Text style={styles.user}>{username}</Text>
      </View>
      <View style={styles.sep} />

      <Text style={styles.section}>LOGICAL ACCURACY</Text>
      <View style={styles.accRow}>
        <Text style={styles.accValue}>{accuracy}%</Text>
        <Text style={styles.accMeta}>Based on {sessions.length} sessions</Text>
      </View>

      <ScoreChart scores={last10.length ? last10 : [60, 62, 58, 65, 70, 72, 75, 78, 80, 84]} />

      <View style={styles.grid}>
        <StatCard label="SESSIONS" value={String(sessions.length)} />
        <StatCard label="AVG SCORE" value={`${avgScore}%`} />
        <StatCard label="EDGE CASES" value={String(edgeTotal)} />
        <StatCard label="BEST STREAK" value={String(streak)} />
      </View>

      <Text style={[styles.section, { marginTop: 18 }]}>FOCUS AREAS</Text>
      <FocusRow label="Boundary Conditions" pct={0.25 + focus.boundary * 0.75} />
      <FocusRow label="Time Complexity" pct={0.2 + focus.time * 0.75} />
      <FocusRow label="Recursive Base Cases" pct={0.1 + focus.recur * 0.75} />

      <View style={{ height: 22 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bgPrimary },
  scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 10 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgSecondary,
  },
  user: { color: COLORS.textSecondary, fontFamily: FONT_MONO, fontSize: 14, letterSpacing: 2 },
  sep: { height: 1, backgroundColor: COLORS.border, marginTop: 14, marginBottom: 16 },
  section: { ...LABEL_STYLE, color: COLORS.textSecondary },
  accRow: { marginTop: 10 },
  accValue: {
    color: COLORS.accent,
    fontFamily: FONT_MONO,
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 48,
  },
  accMeta: { marginTop: 6, color: COLORS.textSecondary, fontFamily: FONT_MONO, fontSize: 12 },
  grid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 12,
  },
  statLabel: { ...LABEL_STYLE, color: COLORS.textMuted },
  statValue: {
    marginTop: 10,
    color: COLORS.textPrimary,
    fontFamily: FONT_MONO,
    fontSize: 22,
    fontWeight: '900',
  },
  focusRow: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 12,
  },
  focusTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  focusLabel: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 13 },
  focusPct: { color: COLORS.warning, fontFamily: FONT_MONO, fontSize: 13, fontWeight: '900' },
  focusTrack: {
    marginTop: 10,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  focusFill: { height: '100%', backgroundColor: COLORS.warning },
});

