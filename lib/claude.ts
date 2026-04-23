import type { AnalysisResult } from '../types';
import { getApiKeyOverride } from './storage';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const ANALYZE_LOGIC_SYSTEM_PROMPT = `You are LogicLens, an AI that evaluates algorithmic reasoning. The user has described their approach to a coding problem in plain English.

Your task:
1. Parse their explanation into clear numbered logical steps (be generous, extract implied steps)
2. Identify 2-5 test cases that simulate their logic (with realistic inputs and expected outputs)
3. Detect edge cases or boundary conditions they did NOT mention (e.g., empty input, duplicates, overflow, single element, negative numbers)
4. Write a brief interviewer note in first person as a senior engineer evaluating them
5. Give a Logic Score from 0–100 based on completeness, correctness, and edge case coverage

Respond ONLY in this exact JSON format:
{
  "steps": [
    { "number": "01", "description": "...", "valid": true }
  ],
  "testCases": [
    { "input": "...", "output": "...", "status": "PASS" }
  ],
  "edgeCases": [
    { "title": "EMPTY INPUT", "description": "..." }
  ],
  "interviewerNote": "...",
  "logicScore": 87,
  "sessionTitle": "Two Sum — Optimal Approach"
}`;

export const INTERVIEW_SYSTEM_PROMPT = `You are a strict but fair senior software engineer conducting a technical interview at a top tech company.

You are evaluating one candidate for one coding problem. After each candidate response, decide whether to continue with a cross-question or end the interview.

Rules:
1) If the candidate explanation is incomplete, unclear, or misses important tradeoffs, continue with exactly one sharp follow-up question.
2) If the candidate demonstrates solid correctness, complexity analysis, and edge-case awareness, you may end the interview.
3) Keep interviewer voice concise and direct.
4) Respond ONLY as JSON in this schema:
{
  "reply": "interviewer text shown to candidate",
  "shouldEnd": false,
  "score": null,
  "finalAssessment": null
}

When shouldEnd is true:
- "reply" should be a short closing line (no question).
- "score" must be an integer 0-100.
- "finalAssessment" must be a 1-3 sentence final evaluation.

When shouldEnd is false:
- "reply" must end with exactly one follow-up question.
- "score" must be null.
- "finalAssessment" must be null.`;

async function resolveApiKey(): Promise<string | null> {
  const override = await getApiKeyOverride();
  if (override) return override;
  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
  return envKey?.trim() ? envKey : null;
}

function extractTextFromGemini(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const textBlocks = parts
      .map((p) => (typeof p?.text === 'string' ? p.text : ''))
      .filter(Boolean);
    return textBlocks.join('\n').trim();
  }
  return '';
}

function extractJsonPayload(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced?.[1] ?? text).trim();
}

export async function analyzeLogic(userInput: string): Promise<AnalysisResult> {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: ANALYZE_LOGIC_SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userInput }] }],
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GEMINI_HTTP_${response.status}:${body}`);
  }

  const data = await response.json();
  const text = extractTextFromGemini(data);
  if (!text) throw new Error('EMPTY_AI_RESPONSE');

  try {
    return JSON.parse(extractJsonPayload(text)) as AnalysisResult;
  } catch {
    throw new Error('INVALID_AI_JSON');
  }
}

export type InterviewTurn = { role: 'user' | 'assistant'; content: string };
export type InterviewReplyPayload = {
  reply: string;
  shouldEnd: boolean;
  score: number | null;
  finalAssessment: string | null;
};

export async function interviewReply(
  turns: InterviewTurn[],
  userMessage: string
): Promise<InterviewReplyPayload> {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const history = turns.map((t) => ({
    role: t.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: t.content }],
  }));

  const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: INTERVIEW_SYSTEM_PROMPT }] },
      contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GEMINI_HTTP_${response.status}:${body}`);
  }

  const data = await response.json();
  const text = extractTextFromGemini(data);
  if (!text) throw new Error('EMPTY_AI_RESPONSE');
  try {
    const parsed = JSON.parse(extractJsonPayload(text)) as InterviewReplyPayload;
    return {
      reply: typeof parsed.reply === 'string' ? parsed.reply.trim() : '',
      shouldEnd: Boolean(parsed.shouldEnd),
      score:
        typeof parsed.score === 'number' && Number.isFinite(parsed.score)
          ? Math.max(0, Math.min(100, Math.round(parsed.score)))
          : null,
      finalAssessment:
        typeof parsed.finalAssessment === 'string' && parsed.finalAssessment.trim()
          ? parsed.finalAssessment.trim()
          : null,
    };
  } catch {
    // Fallback: treat non-JSON output as a normal follow-up question.
    return { reply: text, shouldEnd: false, score: null, finalAssessment: null };
  }
}

