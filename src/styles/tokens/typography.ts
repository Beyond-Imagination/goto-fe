/**
 * Design Tokens - Typography
 * 피그마 스타일 가이드 (함께가길 프로젝트 Node 8-4756) 100% 실제 데이터
 * Typeface: Pretendard
 */

export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

export const fontSize = {
  'display-1': { fontSize: 56, lineHeight: 72.8, letterSpacing: -1.4 },
  'display-2': { fontSize: 48, lineHeight: 62.4, letterSpacing: -1.2 },
  'display-3': { fontSize: 40, lineHeight: 52.0, letterSpacing: -1.0 },
  'headline-1': { fontSize: 32, lineHeight: 41.6, letterSpacing: -0.8 },
  'headline-2': { fontSize: 28, lineHeight: 39.2, letterSpacing: -0.7 },
  'title-1': { fontSize: 24, lineHeight: 33.6, letterSpacing: -0.6 },
  'title-2': { fontSize: 20, lineHeight: 28.0, letterSpacing: -0.5 },
  // letterSpacing은 Typography Guide 전체가 fontSize의 -2.5%를 씁니다.
  'body-1': { fontSize: 18, lineHeight: 26.1, letterSpacing: -0.45 },
  'body-2': { fontSize: 16, lineHeight: 22.4, letterSpacing: -0.4 },
  'body-3': { fontSize: 14, lineHeight: 20.3, letterSpacing: -0.35 },
  'caption-1': { fontSize: 13, lineHeight: 18.85, letterSpacing: -0.325 },
  'caption-2': { fontSize: 12, lineHeight: 17.4, letterSpacing: -0.3 },
  'caption-3': { fontSize: 11, lineHeight: 16.0, letterSpacing: -0.275 },
} as const;

export const typography = {
  fontFamily,
  fontSize,
} as const;

export type TypographyTokens = typeof typography;
