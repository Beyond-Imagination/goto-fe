import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  type NaverMapViewRef,
} from '@mj-studio/react-native-naver-map';

import { Text } from '@/components/common/Text';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { StatusTag } from '@/components/myinfo/Tags';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import { toReportListItem, useAsyncResource, useMyInfoApi } from '@/myinfo';
import { colors } from '@/styles/tokens/colors';

/** 제보들이 한 화면에 들어오도록 잡은 기본 줌. */
const OVERVIEW_ZOOM = 13;

type MyReportsMapScreenProps = {
  readonly onBack: () => void;
};

/**
 * 내 제보 지도 보기.
 * 목록 화면과 같은 데이터를 쓰고, 위치만 지도 한 장에 마커로 모아 보여줍니다.
 */
export function MyReportsMapScreen({ onBack }: MyReportsMapScreenProps) {
  const api = useMyInfoApi();
  const load = useCallback(() => api.findMyReports(), [api]);
  const reports = useAsyncResource(load, '제보 위치를 불러오지 못했어요. 다시 시도해주세요.');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<NaverMapViewRef>(null);
  /** 첫 제보 좌표. onInitialized에서 카메라를 확정할 때 씁니다. */
  const firstReport = reports.data?.[0] ?? null;

  /** iOS에서 initialCamera만으로는 타일 요청이 누락되므로 초기화 직후 카메라를 확정합니다. */
  const handleInitialized = useCallback(() => {
    if (!firstReport) {
      return;
    }
    mapRef.current?.animateCameraTo({
      latitude: firstReport.latitude,
      longitude: firstReport.longitude,
      zoom: OVERVIEW_ZOOM,
      duration: 0,
    });
  }, [firstReport]);

  if (reports.state === 'loading') {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="내 제보 지도" />
        <LoadingView message="제보 위치를 불러오는 중입니다..." />
      </SafeAreaView>
    );
  }

  if (reports.state === 'error' || !reports.data) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="내 제보 지도" />
        <ErrorView
          message={reports.errorMessage ?? '제보 위치를 불러오지 못했어요.'}
          onRetry={reports.reload}
        />
      </SafeAreaView>
    );
  }

  const items = reports.data;
  // 첫 제보를 지도 중심으로 씁니다. 제보가 없으면 지도 대신 안내만 보여줍니다.
  const center = items[0];
  const selected = items.find(report => String(report.id) === selectedId) ?? null;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <MyInfoHeader onBack={onBack} title="내 제보 지도" />

      {center ? (
        <>
          <NaverMapView
            initialCamera={{
              latitude: center.latitude,
              longitude: center.longitude,
              zoom: OVERVIEW_ZOOM,
            }}
            isShowIndoorLevelPicker={false}
            isShowLocationButton={false}
            onInitialized={handleInitialized}
            ref={mapRef}
            style={styles.map}
          >
            {items.map(report => {
              const isSelected = String(report.id) === selectedId;

              return (
                <NaverMapMarkerOverlay
                  anchor={{ x: 0.5, y: 0.5 }}
                  height={isSelected ? 32 : 24}
                  key={report.id}
                  latitude={report.latitude}
                  longitude={report.longitude}
                  onTap={() => setSelectedId(String(report.id))}
                  width={isSelected ? 32 : 24}
                >
                  <View
                    collapsable={false}
                    style={[styles.marker, isSelected ? styles.markerSelected : null]}
                  />
                </NaverMapMarkerOverlay>
              );
            })}
          </NaverMapView>

          <ScrollView contentContainerStyle={styles.sheet} style={styles.sheetWrapper}>
            {selected ? (
              (() => {
                const item = toReportListItem(selected);

                return (
                  <View style={styles.detail}>
                    <Text color={colors.text.primary} variant="body-1" weight="semibold">
                      {item.title}
                    </Text>
                    <Text color={colors.text.secondary} variant="body-3">
                      {item.address}
                    </Text>
                    <Text color={colors.text.disabled} variant="caption-2">
                      {item.meta}
                    </Text>
                    {item.tags.length > 0 ? (
                      <View style={styles.tags}>
                        {item.tags.map(tag => (
                          <StatusTag key={tag.label} label={tag.label} tone={tag.tone} />
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })()
            ) : (
              <Text color={colors.text.secondary} variant="body-3">
                지도에서 제보를 선택하면 상세 정보가 보여요. (총 {items.length}건)
              </Text>
            )}

            {selected ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedId(null)}
                style={styles.clear}
              >
                <Text color={colors.text.secondary} variant="caption-1">
                  선택 해제
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </>
      ) : (
        <View style={styles.empty}>
          <Text color={colors.text.secondary} variant="body-2">
            지도에 표시할 제보가 아직 없어요.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  map: {
    flex: 1,
  },
  sheetWrapper: {
    maxHeight: 200,
  },
  sheet: {
    gap: 10,
    paddingHorizontal: MY_INFO_SCREEN_X,
    paddingVertical: 20,
  },
  detail: {
    gap: 4,
  },
  tags: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  clear: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  marker: {
    backgroundColor: colors.brand.mainAlt,
    borderColor: colors.text.inverse,
    borderRadius: 16,
    borderWidth: 2,
    flex: 1,
  },
  markerSelected: {
    backgroundColor: colors.semantic.danger.DEFAULT,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
