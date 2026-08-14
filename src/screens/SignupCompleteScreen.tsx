import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { BottomBar, PrimaryButton, SecondaryButton } from '@/components/onboarding/Buttons';
import { SCREEN_X } from '@/components/onboarding/tokens';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

interface SignupCompleteScreenProps {
  readonly errorMessage?: string | null;
  readonly onRetry: () => void;
  readonly onEditNickname: () => void;
}

export function SignupCompleteScreen({ errorMessage = null, onRetry, onEditNickname }: SignupCompleteScreenProps) {
  const isSubmitting = errorMessage === null;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        {isSubmitting ? <ActivityIndicator color={colors.brand.mainAlt} size="large" /> : null}
        <Text style={styles.title} variant="headline-1" weight="semibold">
          {isSubmitting ? '가입 정보를 저장하고 있어요' : '가입을 완료하지 못했어요'}
        </Text>
        <Text color={colors.text.secondary} style={styles.message} variant="body-1">
          {isSubmitting ? '잠시만 기다려주세요.' : errorMessage}
        </Text>
      </View>

      {isSubmitting ? null : (
        <BottomBar>
          <View style={styles.actions}>
            <SecondaryButton label="닉네임 수정" onPress={onEditNickname} style={styles.action} />
            <PrimaryButton label="다시 시도" onPress={onRetry} style={styles.action} />
          </View>
        </BottomBar>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_X,
  },
  title: {
    marginTop: spacing[5],
    textAlign: 'center',
  },
  message: {
    marginTop: spacing[3],
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  action: {
    flex: 1,
  },
});
