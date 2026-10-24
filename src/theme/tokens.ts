/**
 * Design tokens. Moonshot ships dark-only for now: the brand is "night sky",
 * and a single palette keeps the scaffold simple. Lime marks upside, coral
 * marks the capped downside.
 */
export const colors = {
  bg: '#0B0B12',
  surface: '#15151F',
  surfaceRaised: '#1E1E2B',
  border: '#2A2A3A',
  text: '#F5F5FA',
  textMuted: '#A3A3B8',
  textFaint: '#6E6E85',
  accent: '#C6FF4D',
  onAccent: '#0B0B12',
  violet: '#9B7BFF',
  upside: '#C6FF4D',
  downside: '#FF6B81',
  yes: '#6EE7F0',
  no: '#FFA36B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '800' },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  heading: { fontSize: 19, lineHeight: 25, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
} as const;
