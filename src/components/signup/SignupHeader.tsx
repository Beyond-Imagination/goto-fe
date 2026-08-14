import { Pressable, StyleSheet, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

import { Text } from '@/components/common/Text';
import { FIGMA_SIGNUP_ASSETS } from '@/design/figmaSignupAssets';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

const HORIZONTAL_PADDING = spacing[5];

export function SignupHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="뒤로 가기"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={styles.back}
      >
        <SvgUri height={14} style={styles.backIcon} uri={FIGMA_SIGNUP_ASSETS.arrowRight} width={18} />
      </Pressable>
      <Text color={colors.text.primary} variant="title-2" weight="semibold">
        {title}
      </Text>
    </View>
  );
}

export const signupLayout = {
  horizontalPadding: HORIZONTAL_PADDING,
} as const;

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  back: {
    left: HORIZONTAL_PADDING,
    padding: spacing[1],
    position: 'absolute',
    transform: [{ rotate: '180deg' }],
  },
  backIcon: {
    transform: [{ scaleY: -1 }],
  },
});
