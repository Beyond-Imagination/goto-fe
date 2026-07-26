/**
 * Design Tokens - Border Radius
 * 코너 라운딩 스케일 토큰
 */

export const radius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export type RadiusTokens = typeof radius;
