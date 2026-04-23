import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '../constants/colors';
import { setOnboarded, getOnboarded } from '../lib/storage';
import { CTA_STYLE, FONT_MONO, LABEL_STYLE } from '../lib/ui';

export default function SplashScreen() {
  const [checked, setChecked] = useState(false);
  const [onboarded, setOnboardedState] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const isOnboarded = await getOnboarded();
      if (!mounted) return;
      setOnboardedState(isOnboarded);
      setChecked(true);
      if (isOnboarded) {
        fade.setValue(1);
        return;
      }
      Animated.timing(fade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    })();
    return () => {
      mounted = false;
    };
  }, [fade]);

  const ctaScale = useMemo(() => new Animated.Value(1), []);

  const onPressInit = async () => {
    await setOnboarded();
    router.replace('/(tabs)/console');
  };

  const onPressInterview = () => {
    router.push('/interview');
  };

  if (!checked) return <View style={styles.screen} />;

  return (
    <View style={styles.screen}>
      <View style={styles.topDecor}>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          <Circle
            cx={70}
            cy={70}
            r={58}
            stroke={COLORS.border}
            strokeWidth={2}
            fill="none"
          />
          <Circle
            cx={85}
            cy={55}
            r={40}
            stroke={COLORS.border}
            strokeWidth={2}
            fill="none"
          />
          <Circle cx={98} cy={44} r={5} fill={COLORS.accent} />
        </Svg>
      </View>

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SYSTEM V1.0.0-BETA</Text>
        </View>

        <Animated.View style={{ opacity: fade }}>
          <Text style={styles.heading}>Debug Your Thinking.</Text>
          <Text style={styles.subtitle}>Before You Debug Your Code.</Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <Pressable
            onPressIn={() =>
              Animated.spring(ctaScale, { toValue: 0.97, useNativeDriver: true }).start()
            }
            onPressOut={() =>
              Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true }).start()
            }
            onPress={onPressInit}
            style={styles.primaryCta}
          >
            <Text style={styles.primaryCtaText}>INITIALIZE SESSION →</Text>
          </Pressable>
        </Animated.View>

        <Pressable onPress={onPressInterview} style={styles.secondaryLink}>
          <Text style={styles.secondaryLinkText}>ENTER INTERVIEW MODE →</Text>
        </Pressable>

        <Text style={styles.footer}>LOGICLENS COGNITIVE DEBUGGER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
  },
  topDecor: {
    position: 'absolute',
    top: 24,
    right: 16,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 56,
    paddingBottom: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  badgeText: {
    ...LABEL_STYLE,
    color: COLORS.accent,
  },
  heading: {
    marginTop: 28,
    color: COLORS.textPrimary,
    fontSize: 40,
    fontWeight: '800',
    fontFamily: FONT_MONO,
    lineHeight: 44,
  },
  subtitle: {
    marginTop: 10,
    color: COLORS.textPrimary,
    fontSize: 18,
    fontStyle: 'italic',
    fontFamily: FONT_MONO,
  },
  primaryCta: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 0,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    ...CTA_STYLE,
    color: '#000000',
    fontWeight: '800',
  },
  secondaryLink: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryLinkText: {
    ...CTA_STYLE,
    color: COLORS.accent,
    fontWeight: '700',
  },
  footer: {
    marginTop: 22,
    textAlign: 'center',
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: FONT_MONO,
  },
});

