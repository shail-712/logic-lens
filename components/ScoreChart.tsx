import { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../constants/colors';

const APath = Animated.createAnimatedComponent(Path);

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function ScoreChart({ scores }: { scores: number[] }) {
  const w = 320;
  const h = 120;
  const pad = 12;
  const len = scores.length;

  const pts = useMemo(() => {
    if (len === 0) return [];
    const xs = scores.map((_, i) => (pad + (i * (w - pad * 2)) / Math.max(1, len - 1)));
    const ys = scores.map((s) => {
      const v = clamp(s, 0, 100) / 100;
      return pad + (1 - v) * (h - pad * 2);
    });
    return xs.map((x, i) => ({ x, y: ys[i] }));
  }, [len, scores]);

  const d = useMemo(() => {
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [pts]);

  const dash = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    dash.setValue(1);
    Animated.timing(dash, { toValue: 0, duration: 700, useNativeDriver: false }).start();
  }, [dash, scores.join(',')]);

  // Approx path length upper bound; sufficient for dash animation
  const approxLen = 700;
  const dashOffset = dash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, approxLen],
  });

  const areaD = useMemo(() => {
    if (pts.length === 0) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${line} L ${last.x} ${h - pad} L ${first.x} ${h - pad} Z`;
  }, [pts]);

  return (
    <View style={styles.wrap}>
      <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.accent} stopOpacity="0.22" />
            <Stop offset="1" stopColor={COLORS.accent} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {areaD ? <Path d={areaD} fill="url(#fill)" /> : null}
        {d ? (
          <APath
            d={d}
            stroke={COLORS.accent}
            strokeWidth={2}
            fill="none"
            strokeDasharray={`${approxLen} ${approxLen}`}
            strokeDashoffset={dashOffset as any}
          />
        ) : null}
        {pts.map((p, idx) => (
          <Circle key={idx} cx={p.x} cy={p.y} r={3} fill={COLORS.accent} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
});

