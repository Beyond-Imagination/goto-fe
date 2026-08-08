import { colors } from "../styles/tokens/colors";

export const FIGMA_TOKENS = {
  canvas: colors.background.primary,
  iconInfo: colors.icon.tertiary,
  iconPrimary: colors.icon.primary,
  labelPrimary: colors.text.primary,
  labelSecondary: colors.text.secondary,
  navigationHeight: 90,
  navigationReferenceWidth: 390,
  tabIconSize: 24,
  tabLabelSize: 11,
  tabRowHeight: 56,
  tabRowWidth: 375,
  touchTargetSize: 48
} as const;
