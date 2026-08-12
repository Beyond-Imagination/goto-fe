import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { BottomBar, PrimaryButton } from '@/components/onboarding/Buttons';
import { SCREEN_X } from '@/components/onboarding/tokens';
import { useProfile } from '@/state/profile';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

/**
 * 온보딩 설정을 마친 뒤 map 메인으로 이어지는 완료 화면입니다.
 */
export function ProfileDoneScreen({ onExplore }: { onExplore?: () => void } = {}) {
  const { profile } = useProfile();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <Text variant="headline-1" weight="semibold">
          접근성 프로필 준비 완료
        </Text>
        <Text color={colors.text.secondary} style={styles.body} variant="body-1">
          {`이동 방식 ${profile.mobility.length}개 · 우선 확인 시설 ${profile.facilities.length}개 · 피하고 싶은 조건 ${profile.avoid.length}개`}
        </Text>
      </View>

      <BottomBar>
        <PrimaryButton href={onExplore ? undefined : '/(tabs)'} label="지도 둘러보기" onPress={onExplore} />
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_X,
  },
  body: {
    marginTop: spacing[3],
  },
});
