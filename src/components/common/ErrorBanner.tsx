import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants';
import { AppText } from './Text';

interface Props {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<Props> = ({ message, onRetry }) => (
  <View style={styles.container}>
    <AppText style={styles.text}>{message}</AppText>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} style={styles.retry}>
        <AppText style={styles.retryText}>Retry</AppText>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.negativeBg,
    borderWidth: 1,
    borderColor: Colors.negativeText,
    borderRadius: Radius.sm,
    margin: Spacing.base,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    color: Colors.negativeText,
    fontSize: 13,
    flex: 1,
  },
  retry: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    backgroundColor: Colors.negativeText,
  },
  retryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
