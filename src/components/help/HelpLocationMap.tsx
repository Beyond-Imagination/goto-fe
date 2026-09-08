import { useCallback, useRef } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';

import { Text } from '@/components/common/Text';
import { formatCoordinates, type Coordinates } from '@/help';
import { colors } from '@/styles/tokens/colors';

/** 좌표를 하나만 보여줄 때 쓰는 기본 줌. 건물 단위가 구분되는 수준입니다. */
const SINGLE_POINT_ZOOM = 16;

type HelpLocationMapProps = {
  readonly coordinates: Coordinates;
  readonly height?: number;
  /** 지도 한가운데 얹는 「요청 위치」 핀 라벨. */
  readonly pinLabel?: string;
  /**
   * 지도를 눌러 좌표를 바꿀 수 있게 합니다.
   * 넘기지 않으면 읽기 전용 지도로 동작합니다.
   */
  readonly onSelect?: (coordinates: Coordinates) => void;
  readonly style?: ViewStyle;
};

/**
 * 도움 요청 위치를 보여주는 지도. onSelect를 주면 탭한 지점으로 좌표를 옮깁니다.
 * (홈 지도 화면과 같은 @mj-studio/react-native-naver-map을 씁니다.)
 */
export function HelpLocationMap({
  coordinates,
  height = 240,
  pinLabel,
  onSelect,
  style,
}: HelpLocationMapProps) {
  const mapRef = useRef<NaverMapViewRef>(null);

  /**
   * iOS에서 initialCamera만 주면 타일 요청이 나가지 않아 지도가 회색으로 남는 경우가 있습니다.
   * (홈 지도는 사용자 조작으로 카메라가 움직여 우연히 가려져 있었습니다.)
   * 초기화 직후 같은 좌표로 카메라를 한 번 확정해 타일 로드를 트리거합니다.
   */
  const handleInitialized = useCallback(() => {
    mapRef.current?.animateCameraTo({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      zoom: SINGLE_POINT_ZOOM,
      duration: 0,
    });
  }, [coordinates.latitude, coordinates.longitude]);

  const handleTapMap = useCallback(
    (event: { latitude: number; longitude: number }) => {
      onSelect?.({ latitude: event.latitude, longitude: event.longitude });
    },
    [onSelect],
  );

  return (
    <View style={[styles.wrapper, { height }, style]}>
      <NaverMapView
        // 카메라는 최초 좌표만 따라가고, 이후에는 사용자의 지도 조작을 방해하지 않습니다.
        initialCamera={{ ...coordinates, zoom: SINGLE_POINT_ZOOM }}
        isShowIndoorLevelPicker={false}
        isShowLocationButton={false}
        onInitialized={handleInitialized}
        onTapMap={onSelect ? handleTapMap : undefined}
        ref={mapRef}
        style={styles.map}
      >
        <NaverMapMarkerOverlay
          anchor={{ x: 0.5, y: 1 }}
          caption={pinLabel ? { text: pinLabel, textSize: 12 } : undefined}
          height={36}
          latitude={coordinates.latitude}
          longitude={coordinates.longitude}
          width={26}
        />
      </NaverMapView>

      <View style={styles.coordinateBadge}>
        <Text color={colors.text.primary} variant="caption-1" weight="medium">
          {formatCoordinates(coordinates)}
        </Text>
      </View>

      {onSelect ? (
        <View style={styles.hint}>
          <Text color={colors.text.inverse} variant="caption-2">
            지도를 눌러 위치를 조정할 수 있어요
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  coordinateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 8,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
    top: 12,
  },
  hint: {
    alignSelf: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.72)',
    borderRadius: 8,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
  },
});
