import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { FONT_MONO, LABEL_STYLE } from '../lib/ui';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function CircularTimer({
  secondsLeft,
  totalSeconds,
}: {
  secondsLeft: number;
  totalSeconds: number;
}) {
  const r = 74;
  const c = 2 * Math.PI * r;
  const pct = totalSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / totalSeconds)) : 0;
  const dash = useMemo(() => c * pct, [c, pct]);

  const mm = Math.floor(secondsLeft / 60);
  const ss = secondsLeft % 60;

  return (
    <View style={styles.wrap}>
      <Svg width={180} height={180} viewBox="0 0 180 180">
        <Circle cx={90} cy={90} r={r} stroke={COLORS.border} strokeWidth={6} fill="none" />
        <Circle
          cx={90}
          cy={90}
          r={r}
          stroke={COLORS.textPrimary}
          strokeWidth={6}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          rotation={-90}
          originX={90}
          originY={90}
          strokeLinecap="butt"
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.time}>
          {pad(mm)}:{pad(ss)}
        </Text>
        <Text style={styles.label}>SESSION TIMER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'center', width: 180, height: 180, marginTop: 16 },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: {
    color: COLORS.textPrimary,
    fontFamily: FONT_MONO,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  label: {
    marginTop: 8,
    ...LABEL_STYLE,
    color: COLORS.accent,
  },
});

