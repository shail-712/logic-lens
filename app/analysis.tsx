import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '../constants/colors';
import { Session, AnalysisResult } from '../types';
import { saveSession } from '../lib/storage';
import LogicStepCard from '../components/LogicStepCard';
import TestCaseRow from '../components/TestCaseRow';
import EdgeCaseCard from '../components/EdgeCaseCard';

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function AnimatedProgressBar({ value }: { value: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: value, duration: 800, useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          { width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );
}

function PulsingDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return <Animated.View style={[styles.pulsingDot, { opacity }]} />;
}

export default function AnalysisScreen() {
  const { sessionData } = useLocalSearchParams<{ sessionData: string }>();
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  const [saved, setSaved] = useState(false);

  const session: Session = sessionData ? JSON.parse(sessionData) : null;
  const result: AnalysisResult | null = session?.result ?? null;

  useEffect(() => {
    if (!session || saved) return;
    saveSession(session);
    setSaved(true);

    if (result) {
      Animated.timing(scoreAnim, {
        toValue: result.logicScore,
        duration: 1000,
        useNativeDriver: false,
      }).start();
      scoreAnim.addListener(({ value }) => setDisplayScore(Math.round(value)));
    }
  }, [session]);

  if (!result) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.textMuted }}>No analysis data.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Analysis Complete</Text>
            <PulsingDot />
          </View>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{result.sessionTitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Section A — Logical Breakdown */}
        <SectionHeader label="LOGICAL BREAKDOWN" />
        {result.steps.map((step, i) => (
          <LogicStepCard key={i} step={step} />
        ))}

        {/* Section B — Test Case Simulation */}
        <SectionHeader label="TEST CASE SIMULATION" />
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>INPUT</Text>
            <Text style={styles.tableHeaderText}>OUT</Text>
            <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>STATUS</Text>
          </View>
          {result.testCases.map((tc, i) => (
            <TestCaseRow key={i} testCase={tc} index={i} />
          ))}
        </View>

        {/* Section C — Edge Case Detection */}
        <SectionHeader label="EDGE CASE DETECTION" />
        {result.edgeCases.map((ec, i) => (
          <EdgeCaseCard key={i} edgeCase={ec} />
        ))}

        {/* Section D — Interviewer Notes */}
        <SectionHeader label="INTERVIEWER NOTES" />
        <View style={styles.noteCard}>
          <Text style={styles.noteQuote}>"{result.interviewerNote}"</Text>
          <Text style={styles.noteAttribution}>— LOGICLENS INTERVIEWER</Text>
        </View>

        {/* Section E — Logic Score */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>LOGIC SCORE</Text>
            <Text style={styles.scoreValue}>{displayScore}%</Text>
          </View>
          <AnimatedProgressBar value={result.logicScore} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  backArrow: {
    fontSize: 22,
    color: Colors.textPrimary,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginTop: 3,
    textTransform: 'uppercase',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    marginBottom: 14,
  },
  sectionBar: {
    width: 3,
    height: 16,
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
  sectionLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  tableCard: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bgTertiary,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1.5,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  noteCard: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 20,
  },
  noteQuote: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontStyle: 'italic',
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 14,
  },
  noteAttribution: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  scoreCard: {
    marginTop: 32,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.accent,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    lineHeight: 54,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },
});
