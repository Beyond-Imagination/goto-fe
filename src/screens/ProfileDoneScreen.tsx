import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { BottomBar, PrimaryButton } from '@/components/onboarding/Buttons';
import { SCREEN_X } from '@/components/onboarding/tokens';
import { useProfile } from '@/state/profile';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

/**
 * 온보딩 플로우의 임시 종착지입니다.
 * 화면기획 8. 홈 지도는 아직 이번 작업 범위가 아니라 자리표시자로 둡니다.
 */
export function ProfileDoneScreen() {
  const { profile } = useProfile();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <Text variant="headline-1" weight="semibold">
          접근성 프로필이 준비됐어요
        </Text>
        <Text color={colors.text.secondary} style={styles.body} variant="body-1">
          {`이동 방식 ${profile.mobility.length}개 · 우선 확인 시설 ${profile.facilities.length}개 · 피하고 싶은 조건 ${profile.avoid.length}개`}
        </Text>
        <Text color={colors.text.disabled} style={styles.note} variant="body-3">
          홈 지도 화면은 다음 작업 범위입니다.
        </Text>
      </View>

      <BottomBar>
        <PrimaryButton href="/(tabs)" label="홈으로 이동" />
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
  note: {
    marginTop: spacing[6],
  },
});
