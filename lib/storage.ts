import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '../types';

export const STORAGE_KEYS = {
  sessions: 'logiclens_sessions',
  onboarded: 'logiclens_onboarded',
  username: 'logiclens_username',
  apiKey: 'logiclens_gemini_api_key',
  legacyApiKey: 'logiclens_anthropic_api_key',
} as const;

export async function getOnboarded(): Promise<boolean> {
  const v = await AsyncStorage.getItem(STORAGE_KEYS.onboarded);
  return v === 'true';
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.onboarded, 'true');
}

export async function getUsername(): Promise<string> {
  const v = await AsyncStorage.getItem(STORAGE_KEYS.username);
  return v?.trim() ? v : 'OPERATOR_01';
}

export async function setUsername(username: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.username, username);
}

export async function getApiKeyOverride(): Promise<string | null> {
  const v = await AsyncStorage.getItem(STORAGE_KEYS.apiKey);
  if (v?.trim()) return v;
  const legacy = await AsyncStorage.getItem(STORAGE_KEYS.legacyApiKey);
  if (legacy?.trim()) return legacy;
  return null;
}

export async function setApiKeyOverride(key: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.apiKey, key.trim());
}

export async function getSessions(): Promise<Session[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Session[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setSessions(sessions: Session[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
}

export async function addSession(session: Session): Promise<void> {
  const sessions = await getSessions();
  await setSessions([session, ...sessions].slice(0, 50));
}

export async function getSessionById(id: string): Promise<Session | null> {
  const sessions = await getSessions();
  return sessions.find((s) => s.id === id) ?? null;
}

