import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../types';

const KEYS = {
  SESSIONS: 'logiclens_sessions',
  ONBOARDED: 'logiclens_onboarded',
  USERNAME: 'logiclens_username',
  API_KEY: 'logiclens_api_key',
};

export async function getSessions(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
}

export async function saveSession(session: Session): Promise<void> {
  try {
    const sessions = await getSessions();
    const updated = [session, ...sessions].slice(0, 50); // keep last 50
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(updated));
  } catch {
    // silent fail
  }
}

export async function clearSessions(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SESSIONS);
}

export async function getOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
}

export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

export async function getUsername(): Promise<string> {
  const val = await AsyncStorage.getItem(KEYS.USERNAME);
  return val || 'OPERATOR_01';
}

export async function setUsername(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.USERNAME, name);
}

export async function getStoredApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.API_KEY);
}

export async function setStoredApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.API_KEY, key);
}
