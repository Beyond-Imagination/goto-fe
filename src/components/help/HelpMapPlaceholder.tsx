import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/common/Text';
import { formatCoordinates, type Coordinates } from '@/help';
import { colors } from '@/styles/tokens/colors';

type HelpMapPlaceholderProps = {
  readonly coordinates: Coordinates;
  readonly height?: number;
  /** 지도 한가운데 얹는 「요청 위치」 핀. */
  readonly pinLabel?: string;
  readonly style?: ViewStyle;
};

/**
 * 지도 자리.
 *
 * 네이버 지도 SDK는 이미 붙어 있습니다(HelpLocationMap·NearbyRequestsMap·홈 지도).
 * TODO: 아직 실지도로 옮기지 않은 도움 요청 상세·대기·시설 연락 화면만 이 자리표시자를 쓰며,
 * 좌표 배지와 자리만 렌더링합니다. 세 화면을 옮기면 이 컴포넌트는 지울 수 있습니다.
 */
export function HelpMapPlaceholder({
  coordinates,
  height = 240,
  pinLabel,
  style,
}: HelpMapPlaceholderProps) {
  return (
    <View style={[styles.map, { height }, style]}>
      <View style={styles.coordinateBadge}>
        <Text color={colors.text.primary} variant="caption-1" weight="medium">
          {formatCoordinates(coordinates)}
        </Text>
      </View>

      {pinLabel ? (
        <View style={styles.pin}>
          <Text color={colors.text.inverse} variant="body-3" weight="semibold">
            {pinLabel}
          </Text>
        </View>
      ) : null}

      <Text color={colors.text.disabled} style={styles.notice} variant="caption-2">
        지도는 준비 중입니다
      </Text>

      <View style={styles.recenterButton}>
        <Text color={colors.icon.primary} variant="body-2">
          ⌖
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: colors.background.light,
    borderColor: colors.border.regular,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coordinateBadge: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: 100,
    borderWidth: 1,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    top: 12,
  },
  pin: {
    alignSelf: 'center',
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  notice: {
    marginTop: 8,
    textAlign: 'center',
  },
  recenterButton: {
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: 39,
    borderWidth: 1,
    bottom: 12,
    height: 45,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    width: 45,
  },
});
