import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { Session } from '../types';

interface Props {
  session: Session;
  onPress: () => void;
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${String(new Date(ts).getHours()).padStart(2, '0')}:${String(new Date(ts).getMinutes()).padStart(2, '0')}`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function getDotColor(score: number): string {
  if (score >= 75) return Colors.accent;
  if (score >= 50) return Colors.warning;
  return Colors.error;
}

export default function SessionRow({ session, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{session.title}</Text>
        <Text style={styles.timestamp}>{formatTimestamp(session.timestamp)}</Text>
      </View>
      <View style={styles.right}>
        <View style={[styles.dot, { backgroundColor: getDotColor(session.logicScore) }]} />
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chevron: {
    fontSize: 20,
    color: Colors.textMuted,
  },
});
