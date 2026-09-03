import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type HelpPrimaryButtonProps = {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
};

/** 도움 요청 흐름의 하단 고정 주요 버튼. */
export function HelpPrimaryButton({ label, onPress, disabled = false }: HelpPrimaryButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text color={colors.text.inverse} variant="body-2" weight="semibold">
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
  buttonDisabled: {
    backgroundColor: colors.neutral[400],
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
