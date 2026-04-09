import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: {
    regular: 'System',          // SF Pro
    medium:  'System',
    semibold: 'System',
    bold:    'System',
  },
  android: {
    regular: 'Roboto',
    medium:  'Roboto-Medium',
    semibold:'Roboto-Medium',
    bold:    'Roboto-Bold',
  },
  default: {
    regular: 'System',
    medium:  'System',
    semibold:'System',
    bold:    'System',
  },
});

export const Typography = {
  // Font families
  fontRegular:  fontFamily?.regular ?? 'System',
  fontMedium:   fontFamily?.medium ?? 'System',
  fontSemibold: fontFamily?.semibold ?? 'System',
  fontBold:     fontFamily?.bold ?? 'System',

  // Font sizes
  xs:   10,
  sm:   12,
  base: 14,
  md:   16,
  lg:   18,
  xl:   20,
  xxl:  24,
  xxxl: 30,

  // Line heights
  lineHeightSm:   16,
  lineHeightBase: 20,
  lineHeightMd:   24,
  lineHeightLg:   28,

  // Font weights
  weightRegular:  '400' as const,
  weightMedium:   '500' as const,
  weightSemibold: '600' as const,
  weightBold:     '700' as const,
} as const;
