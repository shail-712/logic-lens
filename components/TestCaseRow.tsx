import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONT_MONO } from '../lib/ui';
import type { TestCase } from '../types';

export default function TestCaseRow({ tc }: { tc: TestCase }) {
  const ok = tc.status === 'PASS';
  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.input]} numberOfLines={2}>
        {tc.input}
      </Text>
      <Text style={[styles.cell, styles.output]} numberOfLines={2}>
        {tc.output}
      </Text>
      <Text style={[styles.cell, styles.status, { color: ok ? COLORS.accent : COLORS.error }]}>
        {tc.status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    marginTop: 10,
    overflow: 'hidden',
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontFamily: FONT_MONO,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.textPrimary,
  },
  input: { flex: 1.2, borderRightWidth: 1, borderRightColor: COLORS.border },
  output: { flex: 1.2, borderRightWidth: 1, borderRightColor: COLORS.border },
  status: {
    width: 70,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 2,
  },
});

