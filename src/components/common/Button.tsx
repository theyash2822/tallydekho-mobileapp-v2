import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../constants';
import { AppText } from './Text';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = true,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.brandPrimary}
          size="small"
        />
      ) : (
        <AppText style={[styles.text, styles[`text_${variant}` as keyof typeof styles], textStyle]}>
          {label}
        </AppText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.brandPrimary,
  },
  secondary: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  danger: {
    backgroundColor: Colors.negativeBg,
    borderWidth: 1,
    borderColor: Colors.negativeText,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: Typography.base,
    fontWeight: Typography.weightSemibold,
  },
  text_primary: {
    color: Colors.white,
  },
  text_secondary: {
    color: Colors.textPrimary,
  },
  text_ghost: {
    color: Colors.textPrimary,
  },
  text_danger: {
    color: Colors.negativeText,
  },
});
