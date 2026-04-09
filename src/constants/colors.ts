/**
 * TallyDekho Design System — Color Tokens
 * Single source of truth. Never use hardcoded hex elsewhere.
 */
export const Colors = {
  // ─── Backgrounds ────────────────────────────────────────────
  pageBg:       '#F5F4EF',   // warm cream — page/screen background
  cardBg:       '#FFFFFF',   // white — cards, sheets, inputs
  hoverBg:      '#F0EFE9',   // hover state
  activeBg:     '#E8E7E1',   // selected/active state

  // ─── Text ────────────────────────────────────────────────────
  textPrimary:   '#1A1A1A',
  textSecondary: '#787774',
  textTertiary:  '#AEACA8',

  // ─── Borders ─────────────────────────────────────────────────
  borderDefault: '#E9E8E3',
  borderStrong:  '#D4D3CE',

  // ─── Brand / Buttons ─────────────────────────────────────────
  brandPrimary:  '#1A1A1A',   // button bg, active indicators
  brandHover:    '#333333',   // button hover

  // ─── Sidebar ─────────────────────────────────────────────────
  sidebarBg:      '#1A1A1A',
  sidebarText:    '#F5F4EF',
  sidebarActive:  '#333333',
  sidebarInactive:'#9A9A97',

  // ─── Semantic ────────────────────────────────────────────────
  positiveText: '#2D7D46',
  positiveBg:   '#F5F4EF',   // cream — no green bg

  negativeText: '#C0392B',
  negativeBg:   '#FDECEA',

  warningText:  '#D97706',
  warningBg:    '#FFFBEB',

  infoText:     '#2563EB',
  infoBg:       '#EFF6FF',

  // ─── Misc ────────────────────────────────────────────────────
  white:        '#FFFFFF',
  black:        '#000000',
  transparent:  'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
