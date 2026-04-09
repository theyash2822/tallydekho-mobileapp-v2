import React from 'react';
import { Text as RNText, TextProps, StyleSheet, TextStyle } from 'react-native';
import { Colors, Typography } from '../../constants';

interface Props extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label';
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: TextStyle['textAlign'];
}

export const AppText: React.FC<Props> = ({
  variant = 'body',
  color = Colors.textPrimary,
  weight,
  align,
  style,
  children,
  ...rest
}) => {
  return (
    <RNText
      allowFontScaling={false}
      style={[styles[variant], { color, textAlign: align }, weight && { fontWeight: Typography[`weight${capitalize(weight)}` as keyof typeof Typography] as TextStyle['fontWeight'] }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const styles = StyleSheet.create({
  h1: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.weightBold,
    lineHeight: 36,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: Typography.xxl,
    fontWeight: Typography.weightBold,
    lineHeight: Typography.lineHeightLg,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: Typography.xl,
    fontWeight: Typography.weightSemibold,
    lineHeight: Typography.lineHeightMd,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: Typography.base,
    fontWeight: Typography.weightRegular,
    lineHeight: Typography.lineHeightBase,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: Typography.sm,
    fontWeight: Typography.weightRegular,
    lineHeight: Typography.lineHeightSm,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: Typography.xs,
    fontWeight: Typography.weightRegular,
    lineHeight: 14,
    color: Colors.textTertiary,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: Typography.weightMedium,
    lineHeight: Typography.lineHeightSm,
    color: Colors.textSecondary,
  },
});
