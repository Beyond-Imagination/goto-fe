import { StyleSheet } from "react-native";

import { colors } from "@/styles/tokens/colors";
import { radius } from "@/styles/tokens/radius";
import { shadows } from "@/styles/tokens/shadows";
import { spacing } from "@/styles/tokens/spacing";
import { fontSize } from "@/styles/tokens/typography";

export const bottomSheetStyles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing[4],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2]
  },
  handle: {
    backgroundColor: colors.neutral[300],
    borderRadius: radius.full,
    height: 5,
    width: 42
  },
  handleArea: {
    backgroundColor: colors.background.primary,
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[1],
    position: "relative",
    zIndex: 1
  },
  handleButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44
  },
  handleGestureArea: {
    alignSelf: "stretch"
  },
  headerCopy: {
    gap: spacing[1]
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    overflow: "hidden",
    zIndex: 1
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderTopLeftRadius: radius["2xl"],
    borderTopRightRadius: radius["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    elevation: shadows.lg.elevation,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    shadowColor: shadows.lg.shadowColor,
    shadowOffset: shadows.lg.shadowOffset,
    shadowOpacity: shadows.lg.shadowOpacity,
    shadowRadius: shadows.lg.shadowRadius
  },
  summary: {
    ...fontSize["body-3"],
    color: colors.text.secondary,
    fontWeight: "500"
  },
  title: {
    ...fontSize["title-2"],
    color: colors.text.primary,
    fontWeight: "700"
  }
});
