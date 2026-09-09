import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type HelpPrimaryButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  /** 하단에 버튼이 두 개인 화면(제보 완료 등)의 보조 버튼은 테두리만 씁니다. */
  readonly variant?: 'primary' | 'secondary';
};

/** 도움 요청 흐름의 하단 고정 주요 버튼. */
export function HelpPrimaryButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: HelpPrimaryButtonProps) {
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSecondary ? styles.buttonSecondary : null,
        disabled && !isSecondary ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text
        color={isSecondary ? colors.text.primary : colors.text.inverse}
        variant="body-2"
        weight="semibold"
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 12,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  buttonSecondary: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderWidth: 1,
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
