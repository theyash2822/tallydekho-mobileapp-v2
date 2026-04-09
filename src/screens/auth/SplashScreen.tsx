import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { useAuthStore } from '../../store/authStore';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const { hydrate, isAuthenticated, isNewUser } = useAuthStore();

  // Animations
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequence: logo pops in → name fades → tagline → dots pulse → navigate
    Animated.sequence([
      // Logo scale + fade
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // App name
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        delay: 100,
        useNativeDriver: true,
      }),
      // Tagline
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Loading dots
      Animated.stagger(150, [
        Animated.timing(dotAnim1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dotAnim3, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    // Navigate after animation
    const timer = setTimeout(async () => {
      await hydrate();
      const store = useAuthStore.getState();
      if (store.isAuthenticated && !store.isNewUser) {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else if (store.isAuthenticated && store.isNewUser) {
        navigation.reset({ index: 0, routes: [{ name: 'GetStarted' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Background geometric accents */}
      <View style={styles.accentTopRight} />
      <View style={styles.accentBottomLeft} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <View style={styles.logoBox}>
          {/* TallyDekho mark — T + D interlock */}
          <View style={styles.markRow}>
            <View style={styles.markBarV} />
            <View style={styles.markBarH} />
          </View>
          <View style={styles.markDiag} />
        </View>
      </Animated.View>

      {/* App name */}
      <Animated.View style={{ opacity: textOpacity }}>
        <AppText style={styles.appName}>TallyDekho</AppText>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={{ opacity: taglineOpacity }}>
        <AppText style={styles.tagline}>Your business, always in view.</AppText>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        {[dotAnim1, dotAnim2, dotAnim3].map((anim, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
              },
            ]}
          />
        ))}
      </View>

      {/* Bottom badge */}
      <View style={styles.bottomBadge}>
        <AppText style={styles.bottomText}>Made in India 🇮🇳</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Geometric accents
  accentTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  accentBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },

  // Logo mark
  logoWrap: { marginBottom: 28 },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  markBarV: {
    width: 4,
    height: 28,
    backgroundColor: Colors.white,
    borderRadius: 2,
    marginRight: 6,
  },
  markBarH: {
    width: 20,
    height: 4,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  markDiag: {
    width: 24,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
    transform: [{ rotate: '-30deg' }],
  },

  // Text
  appName: {
    fontSize: 32,
    fontWeight: Typography.weightBold,
    color: Colors.white,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.2,
    marginBottom: 48,
  },

  // Loading dots
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  // Bottom
  bottomBadge: {
    position: 'absolute',
    bottom: 40,
  },
  bottomText: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
  },
});
