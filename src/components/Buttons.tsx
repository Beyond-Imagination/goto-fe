import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, spacing, typography } from "../theme";

/**
 * 마지막 요소 아래로 항상 확보할 여백(dp).
 * 홈 인디케이터 인셋이 iOS보다 얕은 안드로이드에서 버튼이 화면 밑에 붙어 보이는 걸 막습니다.
 */
const BOTTOM_GAP = 42;

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, disabled, style }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.primary,
        pressed ? styles.primaryPressed : null,
        disabled ? styles.disabled : null,
        style
      ]}
    >
      <Text style={[styles.label, styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, style }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.secondary,
        pressed ? styles.secondaryPressed : null,
        disabled ? styles.disabled : null,
        style
      ]}
    >
      <Text style={[styles.label, styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

export function SkipLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={12} onPress={onPress} style={styles.skip}>
      <Text style={styles.skipLabel}>건너뛰기</Text>
    </Pressable>
  );
}

type BottomBarProps = {
  children: React.ReactNode;
  /**
   * 마지막 요소 아래 여백. 건너뛰기 링크가 없는 화면은 버튼이 바닥에 붙어 보여서
   * 온보딩처럼 링크가 없는 경우 더 크게 잡습니다.
   */
  bottomGap?: number;
};

/** 화면 하단에 고정되는 액션 영역. 스크롤 콘텐츠 위에 얹힙니다. */
export function BottomBar({ children, bottomGap = BOTTOM_GAP }: BottomBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomGap - insets.bottom, 8) }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: radius.button,
    height: 54,
    justifyContent: "center",
    paddingHorizontal: 20
  },
  primary: {
    backgroundColor: colors.primary
  },
  primaryPressed: {
    backgroundColor: colors.primaryPressed
  },
  secondary: {
    backgroundColor: colors.surfaceLight
  },
  secondaryPressed: {
    backgroundColor: colors.surfacePressed
  },
  disabled: {
    opacity: 0.45
  },
  label: {
    ...typography.button
  },
  primaryLabel: {
    color: colors.white
  },
  secondaryLabel: {
    color: colors.text
  },
  skip: {
    alignSelf: "center",
    paddingVertical: 12
  },
  skipLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textDecorationLine: "underline"
  },
  bottomBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.lineRegular,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
    paddingHorizontal: spacing.screenX,
    paddingTop: 14
  }
});
