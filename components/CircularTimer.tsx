import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/colors';

interface Props {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
}

export default function CircularTimer({ totalSeconds, remainingSeconds, size = 220 }: Props) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const strokeDashoffset = circumference * (1 - progress);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.border}
          strokeWidth={2}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.textPrimary}
          strokeWidth={2}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.inner}>
        <Text style={styles.time}>{timeString}</Text>
        <Text style={styles.label}>Session Timer</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  inner: {
    alignItems: 'center',
  },
  time: {
    fontSize: 42,
    fontWeight: '300',
    color: Colors.textPrimary,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    letterSpacing: 2,
  },
  label: {
    fontSize: 12,
    color: Colors.accent,
    marginTop: 6,
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
});
