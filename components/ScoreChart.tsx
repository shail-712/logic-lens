import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../constants/colors';

interface Props {
  data: number[]; // score values 0-100
  width?: number;
  height?: number;
}

const PADDING = { top: 10, right: 10, bottom: 10, left: 10 };

export default function ScoreChart({ data, width, height = 120 }: Props) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = (width ?? screenWidth - 48);
  const innerW = chartWidth - PADDING.left - PADDING.right;
  const innerH = height - PADDING.top - PADDING.bottom;

  if (data.length < 2) return <View style={{ height }} />;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((val, i) => ({
    x: PADDING.left + (i / (data.length - 1)) * innerW,
    y: PADDING.top + innerH - ((val - minVal) / range) * innerH,
  }));

  // Build SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Fill path (closes back to bottom)
  const fillPath =
    linePath +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(PADDING.top + innerH).toFixed(1)}` +
    ` L ${points[0].x.toFixed(1)} ${(PADDING.top + innerH).toFixed(1)} Z`;

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.accent} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={Colors.accent} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Fill area */}
        <Path d={fillPath} fill="url(#chartFill)" />

        {/* Line */}
        <Path d={linePath} stroke={Colors.accent} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots at each data point */}
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={Colors.accent} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
