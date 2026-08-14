import { spacing } from '@/styles/tokens/spacing';

export const loginLayout = {
  compactBreakpoint: 390,
  compactHorizontalInset: spacing[5],
  contentWidth: 350,
  maximumWidth: 390,
  referenceHorizontalInset: spacing[5],
  brandTopOffset: 156,
  logoGap: spacing[1.5],
  logoMarkHeight: 66,
  logoMarkWidth: 83,
  logoWordmarkFrameHeight: 50,
  logoWordmarkHeight: 32,
  logoWordmarkTopInset: spacing[1.5],
  logoWordmarkWidth: 154,
  titleTopMargin: spacing[3],
  providersTopMargin: 50,
  providersFirstGap: 11,
  providersSecondGap: spacing[3],
  footerBottomOffset: spacing[8],
} as const;

export const socialButton = {
  height: 60,
  iconGap: spacing[3],
  radius: 50,
  iconFrameSize: spacing[6],
  googleIconSize: spacing[6],
  kakaoAssetSize: 18,
  naverAssetSize: 16.5,
  googleLayers: {
    blue: { height: 11.2658, left: 12.24, position: 'absolute' as const, top: 9.8376, width: 11.526 },
    green: { height: 9.7005, left: 1.5168, position: 'absolute' as const, top: 14.2992, width: 18.9984 },
    red: { height: 9.7058, left: 1.5168, position: 'absolute' as const, top: 0, width: 18.7529 },
    yellow: { height: 10.7764, left: 0.24, position: 'absolute' as const, top: 6.6144, width: 5.2625 },
  },
} as const;
