import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { COLORS } from '../constants/colors';
import { interviewReply, type InterviewReplyPayload, type InterviewTurn } from '../lib/claude';
import { getRandomProblem } from '../lib/problems';
import { getApiKeyOverride, setApiKeyOverride } from '../lib/storage';
import { CTA_STYLE, FONT_MONO, LABEL_STYLE } from '../lib/ui';
import type { Problem } from '../types';

const TOTAL_QUESTIONS = 3;

function DifficultyPill({ difficulty }: { difficulty: Problem['difficulty'] }) {
  const bg = difficulty === 'Easy' ? COLORS.accent : difficulty === 'Medium' ? COLORS.warning : COLORS.error;
  const fg = '#000000';
  return (
    <View style={[styles.diffPill, { backgroundColor: bg }]}>
      <Text style={[styles.diffText, { color: fg }]}>{difficulty}</Text>
    </View>
  );
}

export default function InterviewScreen() {
  const [problem, setProblem] = useState<Problem>(() => getRandomProblem());
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<InterviewTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState('');
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [finalAssessment, setFinalAssessment] = useState('');
  const typingRef = useRef<any>(null);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [statusText, setStatusText] = useState('');

  const userTurns = useMemo(() => turns.filter((t) => t.role === 'user').length, [turns]);
  const finished = interviewEnded || userTurns >= TOTAL_QUESTIONS;

  const isMissingKeyError = (message: string) =>
    message.includes('MISSING_API_KEY') ||
    message.includes('GROQ_HTTP_400') ||
    message.includes('GROQ_HTTP_401') ||
    message.includes('GROQ_HTTP_403');

  const isGeminiUnavailableError = (message: string) => message.includes('GROQ_HTTP_404');

  const isTransientError = (message: string) =>
    message.includes('GROQ_HTTP_429') ||
    message.includes('GROQ_HTTP_5') ||
    message.includes('EMPTY_AI_RESPONSE') ||
    message.includes('network') ||
    message.includes('Network') ||
    message.includes('fetch');

  const buildErrorFallback = (message: string) => {
    if (isMissingKeyError(message)) {
      return 'Invalid or missing Groq API key. Update your key and press Retry Interviewer.';
    }
    if (isGeminiUnavailableError(message)) {
      return 'Groq endpoint unavailable for this key/project. Re-save a valid Groq key and press Retry Interviewer.';
    }
    if (isTransientError(message)) {
      return 'Interviewer is temporarily unavailable (server busy or rate limited). Press Retry Interviewer in a few seconds.';
    }
    return 'Interviewer is temporarily unavailable. Press Retry Interviewer in a few seconds.';
  };

  useEffect(() => {
    (async () => {
      const existing = await getApiKeyOverride();
      if (existing) setApiKeyDraft(existing);
    })();
  }, []);

  const askOpeningQuestion = async (currentProblem: Problem) => {
    setLoading(true);
    setStatusText('Connecting interviewer...');
    setTyped('');
    try {
      const payload: InterviewReplyPayload = await interviewReply(
        [],
        [
          `Problem: ${currentProblem.title} (${currentProblem.difficulty})`,
          `Prompt: ${currentProblem.description}`,
          `This is question 1 of ${TOTAL_QUESTIONS}.`,
          'Start the interview now. Ask exactly one concise opening question about approach, correctness, or complexity.',
        ].join('\n')
      );
      const openingText =
        payload.reply?.trim() || 'Walk me through your approach and expected time-space complexity.';
      setTurns([{ role: 'assistant', content: openingText }]);
      typewriter(openingText);
    } catch (e: any) {
      const m = String(e?.message ?? e);
      if (isMissingKeyError(m) || isGeminiUnavailableError(m)) setApiModalOpen(true);
      const fallback = buildErrorFallback(m);
      setTurns([{ role: 'assistant', content: fallback }]);
      setTyped(fallback);
    } finally {
      setStatusText('');
      setLoading(false);
    }
  };

  const saveKey = async () => {
    if (!apiKeyDraft.trim()) return;
    await setApiKeyOverride(apiKeyDraft.trim());
    setApiModalOpen(false);
    if (!turns.length || turns[turns.length - 1]?.content.includes('Invalid or missing Groq API key')) {
      askOpeningQuestion(problem);
    }
  };

  const stopTyping = () => {
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = null;
  };

  const typewriter = (text: string) => {
    stopTyping();
    setTyped('');
    let i = 0;
    typingRef.current = setInterval(() => {
      i += 2;
      setTyped(text.slice(0, i));
      if (i >= text.length) stopTyping();
    }, 18);
  };

  useEffect(() => {
    return () => stopTyping();
  }, []);

  useEffect(() => {
    askOpeningQuestion(problem);
    // Run once for initial problem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async () => {
    if (loading || finished) return;
    const msg = input.trim();
    if (msg.length < 10) {
      Alert.alert('Answer too short', 'Please add more detail before submitting.');
      return;
    }
    setInput('');
    setLoading(true);
    setStatusText('Interviewer is thinking...');
    setTyped('');
    try {
      const nextUserCount = userTurns + 1;
      const baseTurns: InterviewTurn[] = [...turns, { role: 'user', content: msg }];

      const payload: InterviewReplyPayload = await interviewReply(
        baseTurns,
        [
          `Problem: ${problem.title} (${problem.difficulty})`,
          `Prompt: ${problem.description}`,
          `Candidate answer #${nextUserCount} of ${TOTAL_QUESTIONS}: ${msg}`,
          nextUserCount >= TOTAL_QUESTIONS
            ? [
                `This was the final answer (${TOTAL_QUESTIONS}/${TOTAL_QUESTIONS}).`,
                'End interview now.',
                'Return shouldEnd=true, include score, include finalAssessment, and a short closing line in reply.',
              ].join('\n')
            : [
                `Continue interview. Ask exactly one concise follow-up question.`,
                `Next question number must be ${nextUserCount + 1} of ${TOTAL_QUESTIONS}.`,
                'Do not end interview yet.',
              ].join('\n'),
        ].join('\n')
      );

      const assistantText =
        payload.reply?.trim() ||
        (nextUserCount >= TOTAL_QUESTIONS
          ? 'Thanks, that concludes the interview.'
          : 'Please continue and explain your approach in more detail.');
      const next: InterviewTurn[] = [...baseTurns, { role: 'assistant', content: assistantText }];
      setTurns(next);
      typewriter(assistantText);

      if (nextUserCount >= TOTAL_QUESTIONS || payload.shouldEnd) {
        setInterviewEnded(true);
        setFinalAssessment(
          payload.finalAssessment ??
            'Interview complete. Your reasoning is directionally correct; tighten complexity and edge-case handling.'
        );
        setFinalScore(payload.score ?? 70);
      }
    } catch (e: any) {
      const m = String(e?.message ?? e);
      if (isMissingKeyError(m) || isGeminiUnavailableError(m)) setApiModalOpen(true);
      const fallback = buildErrorFallback(m);
      const next: InterviewTurn[] = [
        ...turns,
        { role: 'user', content: msg },
        { role: 'assistant', content: fallback },
      ];
      setTurns(next);
      typewriter(fallback);
    } finally {
      setStatusText('');
      setLoading(false);
    }
  };

  const onNext = () => {
    stopTyping();
    setTyped('');
    setTurns([]);
    setInput('');
    setInterviewEnded(false);
    setFinalScore(null);
    setFinalAssessment('');
    const nextProblem = getRandomProblem();
    setProblem(nextProblem);
    setStatusText('');
    askOpeningQuestion(nextProblem);
  };

  const lastAssistant = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      if (turns[i].role === 'assistant') return turns[i].content;
    }
    return '';
  }, [turns]);

  const assessmentScore = useMemo(() => finalScore, [finalScore]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.replace('/')} style={styles.back} hitSlop={10}>
          <Text style={styles.backText}>{'←'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Interview Mode</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE SESSION</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.problemCard}>
          <View style={styles.problemTop}>
            <DifficultyPill difficulty={problem.difficulty} />
            <Text style={styles.problemTitle}>{problem.title}</Text>
          </View>
          <Text style={styles.problemDesc}>{problem.description}</Text>
          <Text style={styles.promptLabel}>TIME COMPLEXITY PROMPT</Text>
        </View>

        <Text style={styles.section}>EXPLAIN YOUR APPROACH</Text>
        <Text style={styles.progressText}>ANSWER {Math.min(userTurns + 1, TOTAL_QUESTIONS)} OF {TOTAL_QUESTIONS}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Explain your approach..."
            placeholderTextColor={COLORS.textSecondary}
            style={styles.input}
            multiline
            textAlignVertical="top"
            editable={!finished}
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={loading || finished || input.trim().length < 10}
          style={[
            styles.submitBtn,
            (loading || finished || input.trim().length < 10) && { opacity: 0.35 },
          ]}
        >
          <Text style={styles.submitText}>{loading ? '>_ THINKING...' : '>_ SUBMIT ANSWER'}</Text>
        </Pressable>

        {(typed || lastAssistant) && (
          <View style={styles.aiCard}>
            <Text style={styles.aiLabel}>INTERVIEWER</Text>
            <Text style={styles.aiText}>{typed || lastAssistant}</Text>
          </View>
        )}

        {statusText ? (
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        ) : null}

        {finished ? (
          <View style={styles.finalCard}>
            <Text style={styles.finalLabel}>FINAL ASSESSMENT</Text>
            {assessmentScore != null ? <Text style={styles.finalScore}>{assessmentScore}%</Text> : null}
            <Text style={styles.finalBody}>{finalAssessment || 'Interview complete.'}</Text>
          </View>
        ) : null}

        <Pressable onPress={onNext} style={styles.nextBtn}>
          <Text style={styles.nextText}>NEXT QUESTION</Text>
        </Pressable>
        {!finished ? (
          <Pressable
            onPress={() => askOpeningQuestion(problem)}
            disabled={loading}
            style={[styles.nextBtn, loading && { opacity: 0.45 }]}
          >
            <Text style={styles.nextText}>RETRY INTERVIEWER</Text>
          </Pressable>
        ) : null}

        <View style={{ height: 26 }} />
      </ScrollView>

      <Modal visible={apiModalOpen} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalLabel}>API KEY REQUIRED</Text>
            <Text style={styles.modalBody}>Paste a valid Groq API key to continue.</Text>
            <TextInput
              value={apiKeyDraft}
              onChangeText={setApiKeyDraft}
              placeholder="gsk_..."
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.keyInput}
            />
            <View style={styles.modalRow}>
              <Pressable onPress={() => setApiModalOpen(false)} style={[styles.modalBtn, styles.modalBtnGhost]}>
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
  header: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  back: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 16 },
  headerTitle: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 16, flex: 1 },
  liveBadge: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  liveText: { ...LABEL_STYLE, color: COLORS.accent },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  problemCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 14,
  },
  problemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  diffPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  diffText: { ...LABEL_STYLE, fontWeight: '900' },
  problemTitle: { color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 16 },
  problemDesc: { marginTop: 10, color: COLORS.textSecondary, fontFamily: FONT_MONO, fontSize: 13, lineHeight: 18 },
  promptLabel: { marginTop: 12, ...LABEL_STYLE, color: COLORS.textMuted },
  section: { marginTop: 16, ...LABEL_STYLE, color: COLORS.textSecondary },
  progressText: { marginTop: 8, ...LABEL_STYLE, color: COLORS.accent },
  inputWrap: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
  },
  input: {
    minHeight: 140,
    padding: 14,
    color: COLORS.textPrimary,
    fontFamily: FONT_MONO,
    fontSize: 14,
    lineHeight: 20,
  },
  submitBtn: {
    marginTop: 14,
    width: '100%',
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 0,
    alignItems: 'center',
  },
  submitText: { ...CTA_STYLE, color: '#000000', fontWeight: '900' },
  aiCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 14,
  },
  aiLabel: { ...LABEL_STYLE, color: COLORS.accent },
  aiText: { marginTop: 10, color: COLORS.textPrimary, fontFamily: FONT_MONO, fontSize: 13, lineHeight: 18 },
  statusRow: { marginTop: 10, paddingHorizontal: 2 },
  statusText: { ...LABEL_STYLE, color: COLORS.textMuted },
  nextBtn: { marginTop: 16, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 12, alignItems: 'center' },
  nextText: { ...CTA_STYLE, color: COLORS.textPrimary, fontWeight: '800' },
  finalCard: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 14,
  },
  finalLabel: { ...LABEL_STYLE, color: COLORS.textSecondary },
  finalScore: { marginTop: 10, color: COLORS.accent, fontFamily: FONT_MONO, fontSize: 42, fontWeight: '900' },
  finalBody: { marginTop: 10, color: COLORS.textSecondary, fontFamily: FONT_MONO, fontSize: 13, lineHeight: 18 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', padding: 18, justifyContent: 'center' },
  modalCard: { backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, padding: 16 },
  modalLabel: { ...LABEL_STYLE, color: COLORS.accent },
  modalBody: { marginTop: 10, color: COLORS.textSecondary, fontFamily: FONT_MONO, fontSize: 13, lineHeight: 18 },
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
  modalRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 0 },
  modalBtnGhost: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: 'transparent' },
  modalBtnSolid: { backgroundColor: COLORS.accent },
  modalBtnText: { ...CTA_STYLE, fontWeight: '900' },
  modalBtnTextGhost: { color: COLORS.textPrimary },
  modalBtnTextSolid: { color: '#000000' },
});

