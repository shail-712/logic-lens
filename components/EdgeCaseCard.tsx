import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { FONT_MONO, LABEL_STYLE } from '../lib/ui';
import type { EdgeCase } from '../types';

function WarningIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M12 3 2 21h20L12 3Z"
        stroke={COLORS.warning}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M12 9v5" stroke={COLORS.warning} strokeWidth={2} strokeLinecap="round" />
      <Path d="M12 17h.01" stroke={COLORS.warning} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export default function EdgeCaseCard({ edge }: { edge: EdgeCase }) {
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <WarningIcon />
        <Text style={styles.title}>{edge.title}</Text>
      </View>
      <Text style={styles.desc}>{edge.description}</Text>
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
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: {
    ...LABEL_STYLE,
    color: COLORS.warning,
    fontWeight: '800',
  },
  desc: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontFamily: FONT_MONO,
    fontSize: 13,
    lineHeight: 18,
  },
});

