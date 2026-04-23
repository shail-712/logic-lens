import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import Svg, { Path, Circle } from 'react-native-svg';

// Local type alias to avoid importing directly from transitive @react-navigation dep
type BottomTabBarProps = {
  state: { routes: { key: string; name: string }[]; index: number };
  descriptors: Record<string, any>;
  navigation: { emit: (opts: any) => { defaultPrevented: boolean }; navigate: (name: string) => void };
};

function ConsoleIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Path d="M3 5l5 5-5 5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 17h8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function PracticeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={8} stroke={color} strokeWidth={1.8} />
      <Circle cx={11} cy={11} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function OperatorIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={8} r={3.5} stroke={color} strokeWidth={1.8} />
      <Path d="M4 18c0-3.866 3.134-7 7-7h0c3.866 0 7 3.134 7 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

const ICONS = [ConsoleIcon, PracticeIcon, OperatorIcon];
const LABELS = ['CONSOLE', 'PRACTICE', 'OPERATOR'];

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const color = isFocused ? Colors.accent : Colors.textMuted;
        const Icon = ICONS[index];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity key={route.key} style={styles.tab} onPress={onPress} activeOpacity={0.7}>
            {Icon && <Icon color={color} />}
            <Text style={[styles.label, { color }]}>{LABELS[index]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontWeight: '600',
  },
});
