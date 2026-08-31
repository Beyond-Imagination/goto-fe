import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Text } from '@/components/common/Text';
import {
  HELP_SCREEN_X,
  HelpFieldBox,
  HelpHeader,
  HelpMapPlaceholder,
  HelpPrimaryButton,
  HelpSegmented,
  HelpStepProgress,
  InfoMark,
  PlaceSelectCard,
} from '@/components/help';
import {
  getCurrentCoordinates,
  HELP_LOCATION_MODE,
  useHelpRequestApi,
  useHelpRequestDraft,
  type HelpLocationMode,
  type PlaceContactResponse,
} from '@/help';
import { colors } from '@/styles/tokens/colors';

const MODE_OPTIONS = [
  { value: HELP_LOCATION_MODE.insidePlace, label: '장소 안에 있어요' },
  { value: HELP_LOCATION_MODE.onRoad, label: '길 위에 있어요' },
] as const;

/** BE place-contacts의 radiusMeters 상한(1000m)에 맞춘 값. 화면기획의 「내 주위 1km」와 같습니다. */
const PLACE_SEARCH_RADIUS_METERS = 1000;

type HelpLocationScreenProps = {
  readonly onBack: () => void;
  readonly onNext: () => void;
};

/** 도움 03a·03b — 내 위치 입력. 장소 안/길 위를 토글로 전환합니다. */
export function HelpLocationScreen({ onBack, onNext }: HelpLocationScreenProps) {
  const insets = useSafeAreaInsets();
  const helpApi = useHelpRequestApi();
  const { draft, patchDraft } = useHelpRequestDraft();

  const [places, setPlaces] = useState<readonly PlaceContactResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        setIsLoading(true);

        try {
          const current = await getCurrentCoordinates();
          const response = await helpApi.findPlaceContacts({
            latitude: current.latitude,
            longitude: current.longitude,
            radiusMeters: PLACE_SEARCH_RADIUS_METERS,
          });

          if (!isActive) {
            return;
          }

          patchDraft({ coordinates: current });
          setPlaces(response.placeContacts);
        } catch {
          if (isActive) {
            setPlaces([]);
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void load();

      return () => {
        isActive = false;
      };
      // patchDraft는 매 렌더 새로 만들어지므로 의존성에서 제외합니다.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [helpApi]),
  );

  const isInsidePlace = draft.mode === HELP_LOCATION_MODE.insidePlace;
  // 장소 안이면 장소를 골라야 하고, 길 위이면 위치 설명만 있으면 다음으로 넘어갑니다.
  const canProceed =
    draft.locationLabel.trim().length > 0 && (!isInsidePlace || draft.placeId !== null);

  function selectMode(mode: HelpLocationMode) {
    patchDraft(
      mode === HELP_LOCATION_MODE.onRoad
        ? { mode, placeId: null, placeName: null, floorText: '' }
        : { mode },
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="내 위치 입력" />

      <View style={styles.progress}>
        <HelpStepProgress step={1} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.intro}>
          <Text color={colors.text.primary} variant="title-1" weight="semibold">
            지금 어디에 계신가요?
          </Text>
          <Text color={colors.text.secondary} variant="body-1">
            자세히 입력할 수록 도움을 드리기 수월해져요
          </Text>
        </View>

        <HelpSegmented onChange={selectMode} options={MODE_OPTIONS} value={draft.mode} />

        {isInsidePlace ? (
          <>
            <HelpMapPlaceholder coordinates={draft.coordinates} />

            <View style={styles.divider} />

            <View style={styles.sectionTitleRow}>
              <Text color={colors.text.primary} variant="title-2" weight="semibold">
                장소 선택
              </Text>
              <InfoMark />
            </View>

            {isLoading ? (
              <ActivityIndicator color={colors.brand.mainAlt} style={styles.loading} />
            ) : null}

            {!isLoading && places.length === 0 ? (
              <Text color={colors.text.secondary} variant="body-3">
                주변에서 찾은 장소가 없어요. 「길 위에 있어요」로 위치를 알려주세요.
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
                    patchDraft({ placeId: place.placeId, placeName: place.placeName })
                  }
                  placeName={place.placeName}
                  selected={draft.placeId === place.placeId}
                  thumbnailUrl={place.thumbnailUrl}
                />
              ))}
            </View>

            <Text color={colors.text.primary} style={styles.sectionTitle} variant="title-2" weight="semibold">
              현재 위치한 층
            </Text>
            <HelpFieldBox
              keyboardType="number-pad"
              label="층"
              onChangeText={floorText => patchDraft({ floorText })}
              placeholder="ex. 1층"
              required
              value={draft.floorText}
            />
          </>
        ) : (
          <>
            <View style={styles.divider} />

            <Text color={colors.text.primary} variant="title-2" weight="semibold">
              지도에서 위치 찍기
            </Text>
            <HelpMapPlaceholder coordinates={draft.coordinates} />
          </>
        )}

        <Text color={colors.text.primary} style={styles.sectionTitle} variant="title-2" weight="semibold">
          현재 위치 설명
        </Text>
        <HelpFieldBox
          label="위치 설명"
          multiline
          onChangeText={locationLabel => patchDraft({ locationLabel })}
          placeholder="ex. 1층 로비 안내 데스크 앞"
          required
          value={draft.locationLabel}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <HelpPrimaryButton disabled={!canProceed} label="다음 ✓" onPress={onNext} />
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
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 10,
  },
  content: {
    gap: 12,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 29,
  },
  intro: {
    gap: 4,
  },
  divider: {
    backgroundColor: colors.border.regular,
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  loading: {
    marginVertical: 16,
  },
  placeList: {
    gap: 12,
  },
  sectionTitle: {
    marginTop: 20,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  footer: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
});
