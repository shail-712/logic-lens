import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { EdgeCase } from '../types';

interface Props {
  edgeCase: EdgeCase;
}

export default function EdgeCaseCard({ edgeCase }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.warningIcon}>⚠</Text>
        <Text style={styles.title}>{edgeCase.title}</Text>
      </View>
      <Text style={styles.description}>{edgeCase.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.warning + '44',
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    borderRadius: 4,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 14,
    color: Colors.warning,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.warning,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
});
