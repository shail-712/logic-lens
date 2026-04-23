import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { TestCase } from '../types';

interface Props {
  testCase: TestCase;
  index: number;
}

export default function TestCaseRow({ testCase, index }: Props) {
  const isPassing = testCase.status === 'PASS';
  return (
    <View style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
      <Text style={styles.cell} numberOfLines={2}>{testCase.input}</Text>
      <Text style={styles.cell} numberOfLines={2}>{testCase.output}</Text>
      <Text style={[styles.status, isPassing ? styles.pass : styles.fail]}>
        {testCase.status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  rowEven: {
    backgroundColor: Colors.bgSecondary,
  },
  rowOdd: {
    backgroundColor: Colors.bgTertiary,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    paddingHorizontal: 4,
  },
  status: {
    width: 52,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'right',
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  pass: {
    color: Colors.accent,
  },
  fail: {
    color: Colors.error,
  },
});
