import { Text as RNText, type TextProps } from 'react-native';

import { colors, type as typeScale } from '@/theme/tokens';

type Variant = keyof typeof typeScale;
type Tone = 'default' | 'muted' | 'faint' | 'accent' | 'upside' | 'downside' | 'onAccent';

const toneColors: Record<Tone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  faint: colors.textFaint,
  accent: colors.accent,
  upside: colors.upside,
  downside: colors.downside,
  onAccent: colors.onAccent,
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
}

export function Text({ variant = 'body', tone = 'default', style, ...props }: AppTextProps) {
  return <RNText {...props} style={[typeScale[variant], { color: toneColors[tone] }, style]} />;
}
