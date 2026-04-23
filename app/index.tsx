import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/colors';
import { getOnboarded, setOnboarded } from '../lib/storage';

const { width, height } = Dimensions.get('window');

// Subtle dot-grid background using tiny ASCII placeholders — drawn via absolute layout
function GridBackground() {
  const dots = [];
  const cols = Math.ceil(width / 28);
  const rows = Math.ceil(height / 28);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <View
          key={`${r}-${c}`}
          style={{
            position: 'absolute',
            left: c * 28,
            top: r * 28,
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: '#1A1A1A',
          }}
        />,
      );
    }
  }
  return <View style={StyleSheet.absoluteFill}>{dots}</View>;
}

function DecorativeCircles() {
  return (
    <View style={styles.circleContainer}>
      <Svg width={130} height={130}>
        {/* Outer ring */}
        <Circle cx={75} cy={55} r={55} stroke={Colors.accent} strokeWidth={1} fill="none" opacity={0.5} />
        {/* Inner smaller ring */}
        <Circle cx={55} cy={75} r={35} stroke={Colors.accent} strokeWidth={1} fill="none" opacity={0.4} />
        {/* Lime dot */}
        <Circle cx={55} cy={75} r={6} fill={Colors.accent} />
      </Svg>
    </View>
  );
}

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    checkOnboarded();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  async function checkOnboarded() {
    const onboarded = await getOnboarded();
    if (onboarded) {
      router.replace('/(tabs)/console');
    } else {
      setReady(true);
    }
  }

  const handleInitialize = async () => {
    await setOnboarded();
    router.replace('/(tabs)/console');
  };

  const handleInterviewMode = async () => {
    await setOnboarded();
    router.push('/interview');
  };

  if (!ready) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />
      <GridBackground />
      <DecorativeCircles />

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Version badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SYSTEM V1.0.0-BETA</Text>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>Debug Your{'\n'}Thinking.</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Before You Debug{'\n'}Your Code.</Text>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Primary CTA */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleInitialize} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>INITIALIZE SESSION  →</Text>
        </TouchableOpacity>

        {/* Secondary link */}
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleInterviewMode}>
          <Text style={styles.secondaryBtnText}>ENTER INTERVIEW MODE →</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>LOGICLENS COGNITIVE DEBUGGER</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  circleContainer: {
    position: 'absolute',
    top: 50,
    right: -10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Platform.OS === 'ios' ? 48 : 36,
  },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 2,
    marginBottom: 32,
    marginTop: 20,
  },
  badgeText: {
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
    fontWeight: '600',
  },
  headline: {
    fontSize: 44,
    fontWeight: '800',
    color: Colors.accent,
    lineHeight: 50,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontStyle: 'italic',
    lineHeight: 28,
  },
  primaryBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: 0,
    marginBottom: 20,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 32,
  },
  secondaryBtnText: {
    fontSize: 12,
    color: Colors.accent,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
  footer: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace', default: 'monospace' }),
  },
});
