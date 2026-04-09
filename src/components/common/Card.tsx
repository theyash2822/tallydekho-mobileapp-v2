import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
}

export const Card: React.FC<Props> = ({ children, style, onPress, padding = Spacing.base }) => {
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.card, { padding }, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, { padding }, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
});
