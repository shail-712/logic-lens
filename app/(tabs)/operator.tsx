import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Session } from '../../types';
import { getSessions, getUsername } from '../../lib/storage';
import ScoreChart from '../../components/ScoreChart';

const { width } = Dimensions.get('window');

interface Stats {
  sessions: number;
  avgScore: number;
  edgeCases: number;
  bestStreak: number;
  chartData: number[];
  focusAreas: { label: string; value: number }[];
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FocusBar({ label, value }: { label: string; value: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: value, duration: 700, delay: 200, useNativeDriver: false }).start();
  }, []);
  return (
    <View style={styles.focusItem}>
      <View style={styles.focusLabelRow}>
        <Text style={styles.focusLabel}>{label}</Text>
        <Text style={styles.focusPercent}>{value}%</Text>
      </View>
      <View style={styles.focusTrack}>
        <Animated.View
          style={[
            styles.focusFill,
            { width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
    </View>
  );
}

export default function OperatorScreen() {
  const [username, setUsername] = useState('OPERATOR_01');
  const [stats, setStats] = useState<Stats>({
    sessions: 0,
    avgScore: 0,
    edgeCases: 0,
    bestStreak: 0,
    chartData: [],
    focusAreas: [],
  });
  const percentAnim = useRef(new Animated.Value(0)).current;
  const [displayPct, setDisplayPct] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  async function loadData() {
    const [uname, sessions] = await Promise.all([getUsername(), getSessions()]);
    setUsername(uname);

    if (sessions.length === 0) return;

    const totalScore = sessions.reduce((sum, s) => sum + s.logicScore, 0);
    const avgScore = Math.round(totalScore / sessions.length);
    const totalEdgeCases = sessions.reduce((sum, s) => sum + (s.result?.edgeCases?.length ?? 0), 0);

    // Compute best streak of sessions above 70
    let best = 0, cur = 0;
    sessions.forEach((s) => {
      if (s.logicScore >= 70) { cur++; best = Math.max(best, cur); } else cur = 0;
    });

    // Chart data — last 10 scores (oldest to newest)
    const chartData = sessions
      .slice(0, 10)
      .reverse()
      .map((s) => s.logicScore);

    // Focus areas — count edge case titles frequency
    const freq: Record<string, number> = {};
    sessions.forEach((s) => {
      s.result?.edgeCases?.forEach((ec) => {
        const key = ec.title;
        freq[key] = (freq[key] || 0) + 1;
      });
    });
    const maxFreq = Math.max(...Object.values(freq), 1);
    const focusAreas = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count]) => ({ label, value: Math.round((count / maxFreq) * 100) }));

    const computed: Stats = { sessions: sessions.length, avgScore, edgeCases: totalEdgeCases, bestStreak: best, chartData, focusAreas };
    setStats(computed);

    Animated.timing(percentAnim, { toValue: avgScore, duration: 1000, useNativeDriver: false }).start();
    percentAnim.addListener(({ value }) => setDisplayPct(Math.round(value)));
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar + Username */}
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarIcon}>◉</Text>
          </View>
          <View>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.userRole}>COGNITIVE DEBUGGER</Text>
          </View>
        </View>

        <View style={styles.separator} />

        {/* Accuracy section */}
        <Text style={styles.sectionLabel}>LOGICAL ACCURACY</Text>
        <Text style={styles.bigPercent}>{displayPct}%</Text>
        <Text style={styles.sessionsCaption}>Based on {stats.sessions} session{stats.sessions !== 1 ? 's' : ''}</Text>

        {/* Score Chart */}
        {stats.chartData.length >= 2 && (
          <View style={styles.chartContainer}>
            <ScoreChart data={stats.chartData} height={110} />
          </View>
        )}

        {/* Stat Grid */}
        <View style={styles.statGrid}>
          <StatCard label="SESSIONS" value={stats.sessions} />
          <StatCard label="AVG SCORE" value={`${stats.avgScore}%`} />
          <StatCard label="EDGE CASES" value={stats.edgeCases} />
          <StatCard label="BEST STREAK" value={stats.bestStreak} />
        </View>

        {/* Focus Areas */}
        {stats.focusAreas.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 32 }]}>FOCUS AREAS</Text>
            {stats.focusAreas.map((fa, i) => (
              <FocusBar key={i} label={fa.label} value={fa.value} />
            ))}
          </>
        )}

        {stats.sessions === 0 && (
          <Text style={styles.emptyText}>
            Complete your first analysis session to see your operator stats here.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 50,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 22,
    color: Colors.accent,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    letterSpacing: 1,
  },
  userRole: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginBottom: 8,
  },
  bigPercent: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.accent,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    lineHeight: 64,
  },
  sessionsCaption: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 20,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  chartContainer: {
    marginBottom: 24,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 50) / 2,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  focusItem: {
    marginBottom: 18,
  },
  focusLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  focusLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    flex: 1,
    marginRight: 8,
  },
  focusPercent: {
    fontSize: 12,
    color: Colors.warning,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  focusTrack: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  focusFill: {
    height: '100%',
    backgroundColor: Colors.warning,
    borderRadius: 2,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 40,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
});
