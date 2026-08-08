import { colors } from '@/styles/tokens/colors';
import { typography } from '@/styles/tokens/typography';
import { spacing } from '@/styles/tokens/spacing';
import { radius } from '@/styles/tokens/radius';
import { shadows } from '@/styles/tokens/shadows';

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export type Theme = typeof theme;
export default theme;
