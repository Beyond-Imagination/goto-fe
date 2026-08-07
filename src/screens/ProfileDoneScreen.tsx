import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomBar, PrimaryButton } from "../components/Buttons";
import { useProfile } from "../state/profile";
import { colors, spacing, typography } from "../theme";

/**
 * 온보딩 플로우의 임시 종착지입니다.
 * 화면기획 8. 홈 지도는 아직 이번 작업 범위가 아니라 자리표시자로 둡니다.
 */
export function ProfileDoneScreen({ onRestart }: { onRestart: () => void }) {
  const { profile } = useProfile();

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>접근성 프로필이 준비됐어요</Text>
        <Text style={styles.body}>
          {`이동 방식 ${profile.mobility.length}개 · 우선 확인 시설 ${profile.facilities.length}개 · 피하고 싶은 조건 ${profile.avoid.length}개`}
        </Text>
        <Text style={styles.note}>홈 지도 화면은 다음 작업 범위입니다.</Text>
      </View>

      <BottomBar>
        <PrimaryButton label="처음부터 다시 보기" onPress={onRestart} />
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.screenX
  },
  title: {
    ...typography.screenTitle,
    color: colors.text
  },
  body: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: 12
  },
  note: {
    ...typography.caption,
    color: colors.textDisabled,
    marginTop: 24
  }
});
