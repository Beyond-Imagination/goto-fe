import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import {
  HELP_SCREEN_X,
  HelpHeader,
  HelpLocationMap,
  HelpPrimaryButton,
  InfoMark,
  PlaceSelectCard,
} from '@/components/help';
import { getCurrentCoordinates, type Coordinates } from '@/help';
import type { PlaceSearchItem } from '@/placeApi';
import { useAsyncResource } from '@/myinfo';
import { useReportDraft } from '@/report';
import { usePlaceApi } from '@/usePlaceApi';
import { colors } from '@/styles/tokens/colors';

/** 주변 장소 후보 개수. 시안은 3개를 보여줍니다. */
const NEARBY_PLACE_LIMIT = 5;

type NearbyResult = Readonly<{
  coordinates: Coordinates;
  places: readonly PlaceSearchItem[];
}>;

type ReportLocationScreenProps = {
  readonly onBack: () => void;
  readonly onNext: () => void;
  /** 장소 상태 제보처럼 장소를 반드시 골라야 하는 경우 true. */
  readonly requiresPlace?: boolean;
};

/** 제보 02 — 위치를 확인해주세요. */
export function ReportLocationScreen({
  onBack,
  onNext,
  requiresPlace = false,
}: ReportLocationScreenProps) {
  const insets = useSafeAreaInsets();
  const placeApi = usePlaceApi();
  const { draft, patchDraft } = useReportDraft();

  const load = useCallback(async (): Promise<NearbyResult> => {
    const coordinates = await getCurrentCoordinates();
    // 현재 위치를 초안에 반영합니다. 이후 지도 탭·장소 선택이 이 값을 덮어씁니다.
    // (await 뒤이므로 렌더·effect 본문에서 동기 setState 하지 않습니다.)
    patchDraft({ coordinates });

    const result = await placeApi.searchPlaces(coordinates.latitude, coordinates.longitude, {
      k: NEARBY_PLACE_LIMIT,
    });

    return { coordinates, places: result.places };
  }, [patchDraft, placeApi]);

  const nearby = useAsyncResource<NearbyResult>(
    load,
    '주변 장소를 불러오지 못했어요. 지도에서 위치를 직접 찍어도 제보할 수 있어요.',
  );

  const places = nearby.data?.places ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="제보하기" />

      <View style={styles.progress}>
        <View style={styles.progressFill} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.intro}>
          <Text color={colors.text.primary} variant="title-1" weight="semibold">
            위치를 확인해주세요
          </Text>
          <Text color={colors.text.secondary} variant="body-1">
            {/* 장소·시설 제보는 좌표가 아니라 장소에 붙으므로 안내 문구가 다릅니다. */}
            {requiresPlace ? '제보할 장소를 골라주세요' : '지도에서 장애물 위치를 맞춰주세요'}
          </Text>
        </View>

        {/* 지도를 누르면 좌표가 옮겨지고, 장소 선택은 해제됩니다. */}
        <HelpLocationMap
          coordinates={draft.coordinates}
          onSelect={coordinates => patchDraft({ coordinates, placeId: null, placeName: null })}
          pinLabel="제보 위치"
        />

        <View style={styles.sectionTitleRow}>
          <Text color={colors.text.primary} variant="title-2" weight="semibold">
            현재 위치 주변
          </Text>
          <InfoMark />
        </View>

        {nearby.state === 'loading' ? (
          <ActivityIndicator color={colors.brand.mainAlt} style={styles.loading} />
        ) : null}

        {nearby.state === 'error' ? (
          <Text color={colors.text.secondary} variant="body-3">
            {nearby.errorMessage}
          </Text>
        ) : null}

        {nearby.state === 'success' && places.length === 0 ? (
          <Text color={colors.text.secondary} variant="body-3">
            주변에서 찾은 장소가 없어요. 지도에 위치를 찍어 제보해주세요.
          </Text>
        ) : null}

        <View style={styles.placeList}>
          {places.map((place, index) => (
            <PlaceSelectCard
              address={place.address}
              distanceMeters={place.distanceMeters}
              index={index + 1}
              key={place.placeId}
              onPress={() =>
                patchDraft({
                  placeId: place.placeId,
                  placeName: place.name,
                  // 장소를 고르면 그 장소 좌표를 제보 위치로 씁니다.
                  coordinates: { latitude: place.latitude, longitude: place.longitude },
                })
              }
              placeName={place.name}
              selected={draft.placeId === place.placeId}
              thumbnailUrl={place.thumbnailUrl}
            />
          ))}
        </View>

        <View style={styles.notice}>
          {requiresPlace ? (
            <>
              <Text color={colors.text.secondary} variant="caption-1">
                ⓘ 장소를 골라주세요
              </Text>
              <Text color={colors.text.disabled} style={styles.noticeBody} variant="caption-1">
                장소 상태 제보는 좌표가 아니라 장소에 붙어요. 목록에 없다면 길 위 장애물로 제보해주세요.
              </Text>
            </>
          ) : (
            <>
              <Text color={colors.text.secondary} variant="caption-1">
                ⓘ 찾는 장소가 없나요?
              </Text>
              <Text color={colors.text.disabled} style={styles.noticeBody} variant="caption-1">
                공식 데이터에 없는 장소도 지도에 위치를 찍어 제보할 수 있어요.
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <HelpPrimaryButton
          disabled={requiresPlace && draft.placeId === null}
          label="다음"
          onPress={onNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  progress: {
    backgroundColor: colors.border.light,
    height: 4,
    marginHorizontal: HELP_SCREEN_X,
  },
  progressFill: {
    backgroundColor: colors.brand.mainAlt,
    height: 4,
    width: '66%',
  },
  content: {
    gap: 16,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 24,
  },
  intro: {
    gap: 6,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  loading: {
    marginVertical: 12,
  },
  placeList: {
    gap: 10,
  },
  notice: {
    backgroundColor: colors.background.light,
    borderRadius: 10,
    gap: 4,
    padding: 14,
  },
  noticeBody: {
    marginLeft: 14,
  },
  footer: {
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
});
