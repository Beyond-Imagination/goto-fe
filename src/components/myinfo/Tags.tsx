import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { statusTagTone, type StatusTagToneName } from '@/components/myinfo/tokens';
import { colors } from '@/styles/tokens/colors';

/** 썸네일 왼쪽 위에 얹는 제보 분류 라벨 (장애물 / 장소 / 시설). */
export function CategoryTag({ label }: { readonly label: string }) {
  return (
    <View style={styles.category}>
      <Text color={colors.text.inverse} variant="caption-2" weight="semibold">
        {label}
      </Text>
    </View>
  );
}

type StatusTagProps = {
  readonly label: string;
  readonly tone: StatusTagToneName;
};

/** 확인 5명 · 지도반영 · 해결됨 · 아직 있음 같은 상태 필. */
export function StatusTag({ label, tone }: StatusTagProps) {
  const palette = statusTagTone[tone];

  return (
    <View style={[styles.status, { backgroundColor: palette.background, borderColor: palette.color }]}>
      <Text color={palette.color} variant="caption-2">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  category: {
    backgroundColor: colors.brand.mainAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  status: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
});
