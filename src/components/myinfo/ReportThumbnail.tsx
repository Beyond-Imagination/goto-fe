import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type ReportThumbnailProps = {
  /** 제보에 첨부된 사진. 없으면 자리표시자를 보여줍니다. */
  readonly photoUrl?: string | null;
};

/**
 * 제보 목록 항목의 썸네일.
 *
 * 위치를 지도로 보여주려 했지만, 리스트 항목마다 지도 인스턴스를 만들면
 * (네이버 지도 SDK는 인스턴스당 GL 컨텍스트를 잡습니다) 타일이 제대로 그려지지 않고
 * 스크롤도 무거워집니다. 목록에서는 사진/자리표시자만 두고,
 * 위치는 「지도로 보기」(MyReportsMapScreen)에서 지도 하나로 모아 보여줍니다.
 */
export function ReportThumbnail({ photoUrl }: ReportThumbnailProps) {
  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={styles.thumb} />;
  }

  return (
    <View style={[styles.thumb, styles.empty]}>
      <Text color={colors.text.disabled} variant="caption-3">
        사진 없음
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  thumb: {
    backgroundColor: colors.neutral[200],
    height: 72,
    overflow: 'hidden',
    width: 71,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
