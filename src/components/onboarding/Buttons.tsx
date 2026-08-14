import React from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { BOTTOM_GAP, SCREEN_X } from '@/components/onboarding/tokens';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

interface ActionButtonProps {
  href?: Href;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * 온보딩 플로우의 하단 CTA.
 * 공통 Button보다 높이(54)와 라운딩(14)이 크고 폭을 꽉 채우는 형태라 따로 둡니다.
 *
 * href는 Link asChild 대신 router.replace로 처리합니다.
 * Link asChild가 Pressable의 함수형 style을 깨뜨려 버튼이 안 보이는 문제가 있었습니다.
 */
export function PrimaryButton({ href, label, onPress, disabled, style }: ActionButtonProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        onPress?.();
        if (href != null) {
          router.replace(href);
        }
      }}
      style={({ pressed }) => [
        styles.button,
        styles.primary,
        pressed ? styles.primaryPressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text color={colors.text.inverse} variant="body-2" weight="semibold">
        {label}
      </Text>
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
        style,
      ]}
    >
      <Text color={colors.text.primary} variant="body-2" weight="semibold">
        {label}
      </Text>
    </Pressable>
  );
}

export function SkipLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={12} onPress={onPress} style={styles.skip}>
      <Text
        color={colors.text.secondary}
        style={styles.skipLabel}
        variant="body-3"
      >
        건너뛰기
      </Text>
    </Pressable>
  );
}

interface BottomBarProps {
  children: React.ReactNode;
  /** 마지막 요소 아래 여백. 건너뛰기 링크가 없는 화면은 더 크게 잡습니다. */
  bottomGap?: number;
  horizontalPadding?: number;
  showBorder?: boolean;
}

/** 화면 하단에 고정되는 액션 영역. 스크롤 콘텐츠 위에 얹힙니다. */
export function BottomBar({
  children,
  bottomGap = BOTTOM_GAP,
  horizontalPadding = SCREEN_X,
  showBorder = true,
}: BottomBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomBar,
        showBorder ? null : styles.bottomBarWithoutBorder,
        { paddingBottom: Math.max(bottomGap - insets.bottom, 8), paddingHorizontal: horizontalPadding },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: 14,
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },
  primary: {
    backgroundColor: colors.brand.mainAlt,
  },
  primaryPressed: {
    backgroundColor: '#2C2FD6',
  },
  secondary: {
    backgroundColor: colors.background.light,
  },
  secondaryPressed: {
    backgroundColor: colors.border.regular,
  },
  disabled: {
    opacity: 0.45,
  },
  skip: {
    alignSelf: 'center',
    paddingVertical: spacing[3],
  },
  skipLabel: {
    textDecorationLine: 'underline',
  },
  bottomBar: {
    backgroundColor: colors.background.primary,
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[1],
    paddingTop: spacing[3.5],
  },
  bottomBarWithoutBorder: {
    borderTopWidth: 0,
  },
});
