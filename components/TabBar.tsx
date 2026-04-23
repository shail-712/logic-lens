import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { FONT_MONO } from '../lib/ui';

function ConsoleIcon({ active }: { active: boolean }) {
  const stroke = active ? COLORS.accent : COLORS.textSecondary;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M4 5h16v14H4z"
        stroke={stroke}
        strokeWidth={2}
        fill="none"
      />
      <Path
        d="M7 9l3 3-3 3"
        stroke={stroke}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 15h5"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PracticeIcon({ active }: { active: boolean }) {
  const stroke = active ? COLORS.accent : COLORS.textSecondary;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8} stroke={stroke} strokeWidth={2} fill="none" />
      <Circle cx={12} cy={12} r={2} fill={stroke} />
      <Path d="M12 4v2" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function OperatorIcon({ active }: { active: boolean }) {
  const stroke = active ? COLORS.accent : COLORS.textSecondary;
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={3} stroke={stroke} strokeWidth={2} fill="none" />
      <Path
        d="M5 20c1.2-4 12.8-4 14 0"
        stroke={stroke}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export default function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrap}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const label =
          descriptors[route.key]?.options?.title ?? (route.name.toUpperCase() as string);

        const icon =
          route.name === 'console' ? (
            <ConsoleIcon active={isFocused} />
          ) : route.name === 'practice' ? (
            <PracticeIcon active={isFocused} />
          ) : (
            <OperatorIcon active={isFocused} />
          );

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={[styles.item, isFocused && styles.itemActive]}
          >
            {icon}
            <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelIdle]}>
              {String(label).toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  itemActive: {},
  label: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    letterSpacing: 2,
  },
  labelActive: {
    color: COLORS.accent,
  },
  labelIdle: {
    color: COLORS.textSecondary,
  },
});

