import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import {
  SOCIAL_PROVIDER_ACCESSIBILITY_LABELS,
  SOCIAL_PROVIDER_LABELS,
  type SocialProvider,
} from '@/components/auth/socialProviders';
import { socialButton } from '@/components/auth/tokens';
import { SocialProviderIcon } from '@/components/auth/SocialProviderIcon';
import { colors } from '@/styles/tokens/colors';

interface SocialLoginButtonProps {
  readonly provider: SocialProvider;
  readonly onProviderPress?: (provider: SocialProvider) => void;
}

export function SocialLoginButton({ provider, onProviderPress }: SocialLoginButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPointerPressed, setIsPointerPressed] = useState(false);
  const isPointerInteraction = useRef(false);
  const isKakao = provider === 'kakao';
  const isNaver = provider === 'naver';
  const labelColor = isKakao
    ? colors.social.kakaoForeground
    : isNaver
      ? colors.text.inverse
      : colors.text.primary;

  return (
    <Pressable
      accessibilityLabel={SOCIAL_PROVIDER_ACCESSIBILITY_LABELS[provider]}
      accessibilityRole="button"
      onBlur={() => {
        isPointerInteraction.current = false;
        setIsFocused(false);
        setIsPointerPressed(false);
      }}
      onFocus={() => setIsFocused(!isPointerInteraction.current)}
      onPointerCancel={() => setIsPointerPressed(false)}
      onPointerDown={() => {
        isPointerInteraction.current = true;
        setIsFocused(false);
        setIsPointerPressed(true);
      }}
      onPointerLeave={() => setIsPointerPressed(false)}
      onPointerUp={() => setIsPointerPressed(false)}
      onPress={() => onProviderPress?.(provider)}
      style={({ pressed }) => [
        styles.button,
        isKakao ? styles.kakao : null,
        isNaver ? styles.naver : null,
        isFocused ? styles.focused : null,
        pressed || isPointerPressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.content}>
        <SocialProviderIcon provider={provider} />
        <Text color={labelColor} variant="body-1">
          {SOCIAL_PROVIDER_LABELS[provider]}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.social.google,
    borderColor: colors.border.regular,
    borderRadius: socialButton.radius,
    borderWidth: 1,
    height: socialButton.height,
    justifyContent: 'center',
  },
  kakao: {
    backgroundColor: colors.social.kakao,
    borderWidth: 0,
  },
  naver: {
    backgroundColor: colors.social.naver,
    borderWidth: 0,
  },
  pressed: {
    opacity: colors.social.pressedOpacity,
  },
  focused: {
    borderColor: colors.border.focus,
    borderWidth: 2,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: socialButton.iconGap,
    justifyContent: 'center',
  },
});
