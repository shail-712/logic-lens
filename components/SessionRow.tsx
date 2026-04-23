import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONT_MONO } from '../lib/ui';

export default function SessionRow({
  title,
  timestamp,
  dotColor,
  onPress,
}: {
  title: string;
  timestamp: number;
  dotColor: string;
  onPress: () => void;
}) {
  const dt = new Date(timestamp);
  const time = dt.toLocaleString();
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      <View style={styles.right}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.chev}>{'>'}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    backgroundColor: COLORS.bgSecondary,
    marginTop: 10,
  },
  left: { flex: 1, paddingRight: 10 },
  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: FONT_MONO,
    fontWeight: '700',
  },
  time: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONT_MONO,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
  },
  chev: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontFamily: FONT_MONO,
  },
});

