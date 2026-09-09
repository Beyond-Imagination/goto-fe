import { useCallback, useRef } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';

import { Text } from '@/components/common/Text';
import type { Coordinates } from '@/help';
import { colors } from '@/styles/tokens/colors';

/** 반경 수백 미터의 요청들이 한 화면에 들어오는 줌. */
const NEARBY_ZOOM = 15;

export type NearbyRequestMarker = Readonly<{
  id: string;
  latitude: number;
  longitude: number;
  /** 마커 아래에 붙는 짧은 라벨 (장소명 또는 위치 설명). */
  label: string;
}>;

type NearbyRequestsMapProps = {
  readonly center: Coordinates;
  readonly requests: readonly NearbyRequestMarker[];
  readonly selectedId?: string | null;
  readonly onSelect?: (id: string) => void;
  readonly height?: number;
  readonly style?: ViewStyle;
};

/**
 * 도우미가 주변 도움 요청을 지도에서 고르는 화면의 지도.
 * 마커를 누르면 onSelect로 알려서 하단 목록의 해당 카드로 이동합니다.
 */
export function NearbyRequestsMap({
  center,
  requests,
  selectedId,
  onSelect,
  height = 300,
  style,
}: NearbyRequestsMapProps) {
  const mapRef = useRef<NaverMapViewRef>(null);

  /** iOS에서 initialCamera만으로는 타일 요청이 누락되므로 초기화 직후 카메라를 확정합니다. */
  const handleInitialized = useCallback(() => {
    mapRef.current?.animateCameraTo({
      latitude: center.latitude,
      longitude: center.longitude,
      zoom: NEARBY_ZOOM,
      duration: 0,
    });
  }, [center.latitude, center.longitude]);

  return (
    <View style={[styles.wrapper, { height }, style]}>
      <NaverMapView
        initialCamera={{ ...center, zoom: NEARBY_ZOOM }}
        isShowIndoorLevelPicker={false}
        isShowLocationButton={false}
        onInitialized={handleInitialized}
        ref={mapRef}
        style={styles.map}
      >
        {/* 내 위치는 요청 마커와 구분되도록 작은 점으로 표시합니다. */}
        <NaverMapMarkerOverlay
          anchor={{ x: 0.5, y: 0.5 }}
          height={16}
          latitude={center.latitude}
          longitude={center.longitude}
          width={16}
        >
          <View collapsable={false} style={styles.myLocation} />
        </NaverMapMarkerOverlay>

        {requests.map(request => {
          const isSelected = request.id === selectedId;

          return (
            <NaverMapMarkerOverlay
              anchor={{ x: 0.5, y: 0.5 }}
              caption={{ text: request.label, textSize: 11 }}
              height={isSelected ? 34 : 26}
              key={request.id}
              latitude={request.latitude}
              longitude={request.longitude}
              onTap={() => onSelect?.(request.id)}
              width={isSelected ? 34 : 26}
            >
              <View
                collapsable={false}
                style={[styles.requestMarker, isSelected ? styles.requestMarkerSelected : null]}
              />
            </NaverMapMarkerOverlay>
          );
        })}
      </NaverMapView>

      {requests.length === 0 ? (
        <View style={styles.emptyBadge}>
          <Text color={colors.text.primary} variant="caption-1">
            주변에 도움 요청이 없어요
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  myLocation: {
    backgroundColor: colors.brand.main,
    borderColor: colors.text.inverse,
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    width: 16,
  },
  requestMarker: {
    backgroundColor: colors.brand.mainAlt,
    borderColor: colors.text.inverse,
    borderRadius: 17,
    borderWidth: 2,
    flex: 1,
  },
  requestMarkerSelected: {
    backgroundColor: colors.semantic.danger.DEFAULT,
  },
  emptyBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    top: 16,
  },
});
