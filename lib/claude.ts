import type { AnalysisResult } from '../types';
import { getApiKeyOverride } from './storage';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'] as const;

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
  const envKey = (process.env.EXPO_PUBLIC_GROQ_API_KEY ?? process.env.GROQ_API_KEY ?? process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '').trim();
  if (envKey && envKey.toLowerCase() !== 'undefined') return envKey;
  const override = (await getApiKeyOverride())?.trim() ?? '';
  if (override && override.toLowerCase() !== 'undefined') return override;
  return null;
}

function extractTextFromGroq(data: any): string {
  return data?.choices?.[0]?.message?.content || '';
}

function extractJsonPayload(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced?.[1] ?? text).trim();
}

type GroqMessage = { role: string; content: string };
type GroqBody = {
  model?: string;
  messages: GroqMessage[];
  response_format?: { type: 'json_object' };
  temperature?: number;
  max_tokens?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function requestGroq(apiKey: string, body: Omit<GroqBody, 'model'>): Promise<any> {
  let lastErrorText = '';
  let lastStatus = 0;
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 2000;

  for (const model of GROQ_MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      // Back off before retrying (skip delay on the first attempt)
      if (attempt > 0) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }

      let response: Response;
      try {
        response = await fetch(GROQ_BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ ...body, model }),
        });
      } catch (networkErr: any) {
        // Network-level failure (DNS, timeout, offline) — retry
        lastErrorText = String(networkErr?.message ?? networkErr);
        lastStatus = 0;
        continue;
      }

      if (response.ok) {
        return response.json();
      }

      const errorText = await response.text().catch(() => '');
      lastErrorText = errorText;
      lastStatus = response.status;

      // 429 (rate-limit) or 5xx (server error) — retry with backoff
      if (response.status === 429 || response.status >= 500) {
        continue; // will retry or fall through to next model
      }

      // 404 — model not found, skip to next model immediately
      if (response.status === 404) {
        break;
      }

      // Other 4xx (400, 401, 403) — fail fast, no point retrying
      throw new Error(`GROQ_HTTP_${response.status}:${errorText}`);
    }
  }

  throw new Error(`GROQ_HTTP_${lastStatus || 404}:${lastErrorText}`);
}

export async function analyzeLogic(userInput: string): Promise<AnalysisResult> {
  const apiKey = await resolveApiKey();
  if (!apiKey) {
    throw new Error('MISSING_API_KEY');
  }

  const data = await requestGroq(apiKey, {
      messages: [
        { role: 'system', content: ANALYZE_LOGIC_SYSTEM_PROMPT },
        { role: 'user', content: userInput },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      temperature: 0.2,
  });
  const text = extractTextFromGroq(data);
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
    role: t.role,
    content: t.content,
  }));

  const data = await requestGroq(apiKey, {
      messages: [
        { role: 'system', content: INTERVIEW_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
      temperature: 0.4,
  });
  const text = extractTextFromGroq(data);
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

