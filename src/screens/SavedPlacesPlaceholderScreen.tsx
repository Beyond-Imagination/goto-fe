import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';
import { fontFamily, fontSize } from '@/styles/tokens/typography';

/**
 * 저장 탭 자리표시자.
 *
 * TODO: 저장 화면(저장한 장소 목록)이 정의되면 이 화면을 실제 화면으로 교체합니다.
 * 홈·위치·제보 탭은 모두 실제 화면으로 옮겨졌고, 남은 자리표시자는 이 탭 하나입니다.
 */
export function SavedPlacesPlaceholderScreen() {
  return (
    <View accessibilityLiveRegion="polite" role="main" style={styles.placeholder}>
      <Text aria-level={1} role="heading" style={styles.title}>
        저장
      </Text>
      <Text style={styles.description}>저장한 항목은 곧 확인할 수 있습니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  title: {
    color: colors.text.primary,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['title-1'].fontSize,
    letterSpacing: fontSize['title-1'].letterSpacing,
    lineHeight: fontSize['title-1'].lineHeight,
  },
  description: {
    color: colors.text.secondary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize['body-2'].fontSize,
    letterSpacing: fontSize['body-2'].letterSpacing,
    lineHeight: fontSize['body-2'].lineHeight,
    marginTop: spacing[2],
    textAlign: 'center',
  },
});
