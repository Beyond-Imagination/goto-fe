import { useState } from "react";
import { ImageBackground, Pressable, StyleSheet, View } from "react-native";

import { Text as AppText } from "@/components";
import type { PlaceSearchItem } from "@/placeApi";
import { colors } from "@/styles/tokens/colors";
import { radius } from "@/styles/tokens/radius";
import { spacing } from "@/styles/tokens/spacing";

import { homeSectionStyles } from "../homeSectionStyles";

export const RECOMMENDED_PLACES_INITIAL_COUNT = 4;
const RECOMMENDED_PLACES_PAGE_SIZE = 6;
// 진짜 페이지네이션(offset) 없이 상위 K개를 한 번에 받아와 클라이언트에서 순차 공개한다 — 이 값이 노출 가능한 최대 순위다.
export const RECOMMENDED_PLACES_MAX_COUNT = 15;

type RecommendedPlacesSectionProps = {
  readonly nickname: string | undefined;
  readonly onPlacePress: (place: PlaceSearchItem) => void;
  readonly places: readonly PlaceSearchItem[];
};

export function RecommendedPlacesSection({ nickname, onPlacePress, places }: RecommendedPlacesSectionProps) {
  const [visibleCount, setVisibleCount] = useState(RECOMMENDED_PLACES_INITIAL_COUNT);
  const [renderedPlaces, setRenderedPlaces] = useState(places);

  // 지도 이동으로 추천 목록 자체가 새로 바뀌면(places 참조 변경) 이전 위치에서 펼쳐뒀던
  // 개수를 그대로 이어받지 않도록 초기 개수로 되돌린다. 렌더 중 조건부로 처리해
  // (React가 공식적으로 지원하는 "prop 변경에 대한 state 조정" 패턴) 불필요한 추가
  // 렌더 사이클을 만드는 useEffect 기반 리셋을 피한다.
  if (places !== renderedPlaces) {
    setRenderedPlaces(places);
    setVisibleCount(RECOMMENDED_PLACES_INITIAL_COUNT);
  }

  if (places.length === 0) {
    return null;
  }

  const visiblePlaces = places.slice(0, visibleCount);
  const nextCount = Math.min(visibleCount + RECOMMENDED_PLACES_PAGE_SIZE, places.length);
  const hasMore = visibleCount < places.length;

  return (
    <View style={homeSectionStyles.sections}>
      <AppText style={homeSectionStyles.sectionHeading} variant="title-2" weight="semibold">
        {nickname ? (
          <>
            <AppText color={colors.brand.main} variant="title-2" weight="semibold">
              {nickname}
            </AppText>
            님을 위한 추천 관광지
          </>
        ) : (
          "추천 관광지"
        )}
      </AppText>
      <View style={styles.placeGrid}>
        {visiblePlaces.map((place, index) => {
          const distanceKm = (place.distanceMeters / 1000).toFixed(1);
          return (
            <Pressable
              accessibilityLabel={`${String(index + 1)}위 ${place.name}, 여기서 ${distanceKm}km`}
              accessibilityRole="button"
              key={place.placeId}
              onPress={() => onPlacePress(place)}
              style={styles.placeCard}
            >
              <ImageBackground
                imageStyle={styles.placeCardImage}
                source={place.thumbnailUrl ? { uri: place.thumbnailUrl } : undefined}
                style={[styles.placeCardImage, styles.placeCardImageWrapper]}
              >
                <View pointerEvents="none" style={styles.placeCardScrim} />
                <View style={styles.placeCardHeader}>
                  <AppText color={colors.text.inverse} style={styles.placeCardBadgeText} variant="headline-2" weight="bold">
                    {index + 1}
                  </AppText>
                  <AppText
                    color={colors.text.inverse}
                    numberOfLines={1}
                    style={styles.placeCardTitle}
                    variant="body-1"
                    weight="regular"
                  >
                    {place.name}
                  </AppText>
                </View>
                <AppText color={colors.text.inverse} style={styles.placeCardDistance} variant="caption-2">
                  여기서 {distanceKm}km
                </AppText>
              </ImageBackground>
            </Pressable>
          );
        })}
      </View>
      {hasMore || visibleCount > RECOMMENDED_PLACES_INITIAL_COUNT ? (
        <Pressable
          onPress={() => (hasMore ? setVisibleCount(nextCount) : setVisibleCount(RECOMMENDED_PLACES_INITIAL_COUNT))}
          style={styles.placeMoreButton}
        >
          <AppText variant="body-3" weight="semibold">
            {hasMore ? `${String(visibleCount + 1)}~${String(nextCount)}위 더보기` : "접기"}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  placeCard: {
    width: "47%"
  },
  placeCardBadgeText: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3
  },
  placeCardDistance: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3
  },
  placeCardHeader: {
    alignItems: "flex-start",
    flexDirection: "column"
  },
  placeCardImage: {
    borderRadius: radius.lg
  },
  placeCardImageWrapper: {
    aspectRatio: 0.75,
    // 썸네일 없는 장소는 흰 텍스트가 안 묻히도록 밝은 회색 대신 중간 톤 회색을 배경으로 쓴다.
    backgroundColor: colors.neutral[400],
    justifyContent: "space-between",
    overflow: "hidden",
    padding: spacing[2],
    position: "relative"
  },
  placeCardScrim: {
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  placeCardTitle: {
    alignSelf: "stretch",
    // headline-2/body-1 모두 줄간격이 실제 글자 높이보다 커서, 음수 margin으로 그 여백을 상쇄한다.
    marginTop: -8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3
  },
  placeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3]
  },
  placeMoreButton: {
    alignItems: "center",
    borderColor: colors.border.regular,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingVertical: spacing[2]
  }
});
