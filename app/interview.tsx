import React, { useEffect, useRef, useState } from 'react';
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
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';
import { PROBLEMS } from '../lib/problems';
import { sendInterviewMessage } from '../lib/gemini';
import { InterviewMessage, Problem } from '../types';

const MAX_TURNS = 5;

function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        onDone?.();
      }
    }, 18);
    return () => clearInterval(interval);
  }, [text]);
  return <Text style={styles.aiResponseText}>{displayed}</Text>;
}

export default function InterviewScreen() {
  const [problem] = useState<Problem>(() => PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)]);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [turn, setTurn] = useState(0);
  const [latestAI, setLatestAI] = useState('');
  const [typingDone, setTypingDone] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Opening question from interviewer
    const openingMsg = `Good to meet you. I'll be your interviewer today. We'll be working through a problem called "${problem.title}". Here's the scenario: ${problem.description} Let's start — can you walk me through your initial high-level approach?`;
    setLatestAI(openingMsg);
    setTypingDone(false);
    setMessages([{ role: 'model', content: openingMsg }]);
  }, []);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ).start();
  }

  async function handleSubmit() {
    if (!userInput.trim() || loading || turn >= MAX_TURNS) return;

    const newUserMsg: InterviewMessage = { role: 'user', content: userInput.trim() };
    const updatedMessages: InterviewMessage[] = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setUserInput('');
    setLoading(true);
    setTypingDone(false);
    startPulse();

    const newTurn = turn + 1;
    setTurn(newTurn);

    if (newTurn >= MAX_TURNS) {
      // Final assessment
      try {
        const summary = await sendInterviewMessage(
          [...updatedMessages, { role: 'user', content: 'Please provide a final assessment of my performance in 2-3 sentences, and give a score out of 100.' }],
          `${problem.title}: ${problem.description}`,
        );
        const finalMsg: InterviewMessage = { role: 'model', content: summary };
        setMessages((prev) => [...prev, finalMsg]);
        setLatestAI(summary);
        setSessionEnded(true);
      } catch {
        setLatestAI('Session complete. You showed strong problem-solving skills. Well done!');
        setSessionEnded(true);
      }
      setLoading(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      return;
    }

    try {
      const aiReply = await sendInterviewMessage(updatedMessages, `${problem.title}: ${problem.description}`);
      const aiMsg: InterviewMessage = { role: 'model', content: aiReply };
      setMessages((prev) => [...prev, aiMsg]);
      setLatestAI(aiReply);
    } catch {
      setLatestAI('Could not connect to AI. Please check your API key.');
    } finally {
      setLoading(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }

  const difficultyColor =
    problem.difficulty === 'Hard' ? Colors.error :
    problem.difficulty === 'Medium' ? Colors.warning : Colors.accent;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Interview Mode</Text>
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE SESSION</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Problem Card */}
          <View style={styles.problemCard}>
            <View style={[styles.diffBadge, { borderColor: difficultyColor }]}>
              <Text style={[styles.diffBadgeText, { color: difficultyColor }]}>{problem.difficulty}</Text>
            </View>
            <Text style={styles.problemTitle}>{problem.title}</Text>
            <Text style={styles.problemDesc}>{problem.description}</Text>
          </View>

          {/* Turn counter */}
          <Text style={styles.turnLabel}>TURN {turn}/{MAX_TURNS}</Text>

          {/* AI Response */}
          {latestAI !== '' && (
            <View style={styles.aiResponseCard}>
              <Text style={styles.aiLabel}>◉ INTERVIEWER</Text>
              {typingDone ? (
                <Text style={styles.aiResponseText}>{latestAI}</Text>
              ) : (
                <TypewriterText text={latestAI} onDone={() => setTypingDone(true)} />
              )}
            </View>
          )}

          {/* Message History (collapsed, just user messages) */}
          {messages.filter((m) => m.role === 'user').length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.historyLabel}>YOUR RESPONSES</Text>
              {messages
                .filter((m) => m.role === 'user')
                .map((m, i) => (
                  <View key={i} style={styles.userMsgCard}>
                    <Text style={styles.userMsgText}>{m.content}</Text>
                  </View>
                ))}
            </View>
          )}

          {sessionEnded && (
            <View style={styles.scorecardBox}>
              <Text style={styles.scorecardTitle}>SESSION COMPLETE</Text>
              <Text style={styles.scorecardSub}>Your final assessment is shown above.</Text>
              <TouchableOpacity style={styles.scorecardBtn} onPress={() => router.replace('/(tabs)/console')}>
                <Text style={styles.scorecardBtnText}>BACK TO CONSOLE</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Input area */}
        {!sessionEnded && (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Explain your approach..."
              placeholderTextColor={Colors.textMuted}
              value={userInput}
              onChangeText={setUserInput}
              editable={!loading && typingDone}
            />
            <TouchableOpacity
              style={[styles.submitBtn, (loading || !userInput.trim() || !typingDone) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading || !userInput.trim() || !typingDone}
            >
              {loading ? (
                <Animated.Text style={[styles.submitBtnText, { opacity: pulseAnim }]}>...</Animated.Text>
              ) : (
                <Text style={styles.submitBtnText}>›_ SUBMIT</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
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
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: Colors.textPrimary },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  liveBadge: {
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
  },
  liveBadgeText: {
    fontSize: 9,
    color: Colors.accent,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontWeight: '700',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  problemCard: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  problemDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  turnLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginBottom: 14,
  },
  aiResponseCard: {
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
    borderRadius: 4,
    padding: 16,
    marginBottom: 20,
  },
  aiLabel: {
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginBottom: 10,
  },
  aiResponseText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  historySection: {
    marginTop: 8,
  },
  historyLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    marginBottom: 10,
  },
  userMsgCard: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
  },
  userMsgText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  scorecardBox: {
    marginTop: 24,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.accent + '44',
    borderRadius: 4,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  scorecardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  scorecardSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  scorecardBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  scorecardBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  inputArea: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 10,
  },
  input: {
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    color: Colors.textPrimary,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 0,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
});
