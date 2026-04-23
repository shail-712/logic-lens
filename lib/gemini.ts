import { AnalysisResult, InterviewMessage } from '../types';
import { getStoredApiKey } from './storage';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const ANALYZE_LOGIC_SYSTEM_PROMPT = `You are LogicLens, an AI that evaluates algorithmic reasoning. The user has described their approach to a coding problem in plain English.

Your task:
1. Parse their explanation into clear numbered logical steps (be generous, extract implied steps)
2. Identify 2-5 test cases that simulate their logic (with realistic inputs and expected outputs)
3. Detect edge cases or boundary conditions they did NOT mention (e.g., empty input, duplicates, overflow, single element, negative numbers)
4. Write a brief interviewer note in first person as a senior engineer evaluating them
5. Give a Logic Score from 0–100 based on completeness, correctness, and edge case coverage

Respond ONLY in this exact JSON format with no markdown, no code fences, just raw JSON:
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

const INTERVIEW_SYSTEM_PROMPT = `You are a strict but fair senior software engineer conducting a technical interview at a top tech company. You ask probing follow-up questions, challenge assumptions, and push the candidate to think about edge cases and complexity. You speak in first person, directly to the candidate. Keep responses under 100 words. End every response with exactly one follow-up question.`;

async function getApiKey(): Promise<string> {
  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (envKey && envKey !== 'your_gemini_api_key_here') return envKey;
  const stored = await getStoredApiKey();
  if (stored) return stored;
  throw new Error('NO_API_KEY');
}

export async function analyzeLogic(userInput: string): Promise<AnalysisResult> {
  const apiKey = await getApiKey();
  const url = `${GEMINI_BASE}?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: ANALYZE_LOGIC_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userInput }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API Error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip any accidental markdown fences
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned) as AnalysisResult;
}

export async function sendInterviewMessage(
  messages: InterviewMessage[],
  problemContext: string,
): Promise<string> {
  const apiKey = await getApiKey();
  const url = `${GEMINI_BASE}?key=${apiKey}`;

  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: `${INTERVIEW_SYSTEM_PROMPT}\n\nThe problem being discussed: ${problemContext}` }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`API Error ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
