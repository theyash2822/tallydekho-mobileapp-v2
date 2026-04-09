import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, Radius } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STEPS = [
  'Connecting to Tally...',
  'Verifying company data...',
  'Syncing ledgers...',
  'Syncing vouchers...',
  'Almost done...',
];

export default function PairingProgressScreen() {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 6000,
      useNativeDriver: false,
    }).start(() => setDone(true));

    // Step through messages
    const interval = setInterval(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    }, 1200);

    // Pulsing dot
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    return () => clearInterval(interval);
  }, []);

  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        {/* Logo pulsing */}
        <Animated.View style={[s.logoWrap, { opacity: dotAnim }]}>
          <View style={s.logo}><AppText style={s.logoMark}>✦</AppText></View>
        </Animated.View>

        <AppText style={s.heading}>Pairing with Tally...</AppText>
        <AppText style={s.sub}>This might take a few minutes.</AppText>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <Animated.View style={[s.progressFill, { width }]} />
        </View>

        {/* Current step */}
        <AppText style={s.stepText}>{STEPS[step]}</AppText>

        {/* Completed steps */}
        <View style={s.stepsList}>
          {STEPS.slice(0, step).map((st, i) => (
            <View key={i} style={s.stepRow}>
              <AppText style={s.stepCheck}>✓</AppText>
              <AppText style={s.stepDone}>{st}</AppText>
            </View>
          ))}
        </View>

        {done && (
          <View style={s.successWrap}>
            <AppText style={s.successIcon}>✓</AppText>
            <AppText style={s.successText}>Tally paired successfully!</AppText>
            <Button
              label="Go to Dashboard"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
              style={s.btn}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center', alignItems: 'center' },
  logoWrap: { marginBottom: Spacing.xl },
  logo: { width: 72, height: 72, borderRadius: 20, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center' },
  logoMark: { fontSize: 32, color: Colors.white },
  heading: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  sub: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing.xl },
  progressBg: { width: '100%', height: 6, backgroundColor: Colors.borderDefault, borderRadius: 3, overflow: 'hidden', marginBottom: Spacing.base },
  progressFill: { height: 6, backgroundColor: Colors.brandPrimary, borderRadius: 3 },
  stepText: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.base },
  stepsList: { width: '100%' },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: Spacing.sm },
  stepCheck: { fontSize: 14, color: Colors.positiveText, fontWeight: Typography.weightBold },
  stepDone: { fontSize: Typography.sm, color: Colors.textTertiary },
  successWrap: { alignItems: 'center', marginTop: Spacing.xl },
  successIcon: { fontSize: 48, marginBottom: Spacing.sm },
  successText: { fontSize: Typography.lg, fontWeight: Typography.weightSemibold, color: Colors.positiveText, marginBottom: Spacing.base },
  btn: { minWidth: 200 },
});
