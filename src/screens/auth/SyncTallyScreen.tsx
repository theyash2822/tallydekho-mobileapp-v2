import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography } from '../../constants';
import { AppText } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import type { RootStackParamList } from '../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SyncTallyScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <AppText style={styles.logoSymbol}>✦</AppText>
          </View>
          <AppText style={styles.appName}>Tallydekho</AppText>
        </View>

        <AppText style={styles.heading}>Would you like to sync with Tally?</AppText>
        <AppText style={styles.subtext}>
          Connect TallyDekho with Tally Prime to automatically sync your data. You'll need the TallyDekho Desktop app installed on your Windows machine.
        </AppText>

        <View style={styles.btnGroup}>
          <Button
            label="Yes, Connect Tally"
            onPress={() => navigation.navigate('PairTally')}
            style={styles.primaryBtn}
          />
          <Button
            label="Skip for now"
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] })}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.pageBg },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: Spacing.xl },
  logoMark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.brandPrimary,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  logoSymbol: { fontSize: 32, color: Colors.white },
  appName: { fontSize: Typography.xxl, fontWeight: Typography.weightBold, color: Colors.textPrimary },
  heading: { fontSize: Typography.xl, fontWeight: Typography.weightBold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtext: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xxl },
  btnGroup: { gap: Spacing.sm },
  primaryBtn: { marginBottom: 0 },
});
