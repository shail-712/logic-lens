import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONT_MONO } from '../lib/ui';

export default function LogicStepCard({
  number,
  description,
  valid,
}: {
  number: string;
  description: string;
  valid: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.num}>{number}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.desc}>{description}</Text>
        </View>
        <Text style={[styles.mark, { color: valid ? COLORS.accent : COLORS.error }]}>
          {valid ? '✓' : '✕'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    padding: 12,
  },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  num: {
    color: COLORS.textSecondary,
    fontFamily: FONT_MONO,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 2,
    width: 30,
  },
  desc: {
    color: COLORS.textPrimary,
    fontFamily: FONT_MONO,
    fontSize: 14,
    lineHeight: 20,
  },
  mark: {
    fontFamily: FONT_MONO,
    fontSize: 16,
    marginTop: 0,
  },
});

