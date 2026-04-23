import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { LogicStep } from '../types';

interface Props {
  step: LogicStep;
}

export default function LogicStepCard({ step }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.number}>{step.number}</Text>
      <Text style={styles.description}>{step.description}</Text>
      <Text style={[styles.icon, step.valid ? styles.valid : styles.invalid]}>
        {step.valid ? '✓' : '✗'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  number: {
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontSize: 11,
    color: Colors.textMuted,
    width: 20,
    paddingTop: 2,
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  icon: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingTop: 1,
  },
  valid: {
    color: Colors.accent,
  },
  invalid: {
    color: Colors.error,
  },
});
