import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  type Camera,
  type Coord,
  type NaverMapViewRef,
  type Region
} from "@mj-studio/react-native-naver-map";

import { useAuth } from "@/auth";
import { IconStroller } from "@/components/icons/IconStroller";
import { IconWheelchair } from "@/components/icons/IconWheelchair";
import { logger } from "@/utils/logger";
import { colors } from "@/styles/tokens/colors";
import { radius } from "@/styles/tokens/radius";
import { spacing } from "@/styles/tokens/spacing";

import {
  type MobilityType,
  type ObstacleIssueType,
  type ObstacleReportCluster
} from "@/obstacleReportApi";
import {
  type NearbyAccessibilitySummary,
  type PlaceSearchItem
} from "@/placeApi";
import { useObstacleReportApi } from "@/useObstacleReportApi";
import { usePlaceApi } from "@/usePlaceApi";
import { useAsyncResource, useMyInfoApi } from "@/myinfo";
import { getRecentlyViewedPlaces, recordPlaceView, type RecentlyViewedPlace } from "@/state/recentlyViewedPlaces";

import {
  ISSUE_TYPE_MARKER_ANCHOR_X,
  ISSUE_TYPE_MARKER_ANCHOR_Y,
  ISSUE_TYPE_MARKER_CAPTION_SIZE,
  ISSUE_TYPE_MARKER_HEIGHT_RATIO,
  ISSUE_TYPE_MARKER_WIDTH_RATIO,
  issueTypeMarkerCaptionColor,
  issueTypeMarkerIcon,
  issueTypeMarkerSize
} from "./issueTypeMarkerIcons";
import { MapHomeSheet } from "./MapHomeSheet";
import { clusterSeverityColor, clusterSeverityLabel } from "./obstacleSeverityStyle";
import { RECOMMENDED_PLACES_MAX_COUNT } from "./sections/RecommendedPlacesSection";
import { tieredValue } from "./tieredValue";
import { getZoomTier, type ZoomTier } from "./zoomTiers";
import { CloseZoomContent } from "./zoomContent/CloseZoomContent";
import { FarZoomContent } from "./zoomContent/FarZoomContent";
import { MidZoomContent } from "./zoomContent/MidZoomContent";

// 실제 위치 권한 연동 전까지의 임시 기본 위치 (서울시청).
const DEFAULT_CENTER: Coord = { latitude: 37.5665, longitude: 126.978 };
const DEFAULT_ZOOM = 11;
const CLUSTER_TAP_ZOOM_STEP = 3;
const MAP_MAX_ZOOM = 21;

const MOBILITY_TYPE_OPTIONS: {
  value: MobilityType;
  label: string;
  Icon?: ComponentType<{ color?: string; size?: number }>;
}[] = [
  { Icon: IconWheelchair, label: "휠체어", value: "WHEELCHAIR" },
  { Icon: IconStroller, label: "유모차", value: "STROLLER" },
  { label: "서행", value: "SLOW_WALKER" }
];

const ISSUE_TYPE_EXCLUDE_OPTIONS: { value: ObstacleIssueType; label: string }[] = [
  { value: "HIGH_CURB", label: "높은턱 제외" },
  { value: "STAIRS", label: "계단 제외" },
  { value: "STEEP_SLOPE", label: "급경사 제외" }
];

type Viewport = {
  center: Coord;
  zoom: number;
  region: Region;
};

function regionToBbox(region: Region) {
  return {
    minLat: region.latitude,
    minLng: region.longitude,
    maxLat: region.latitude + region.latitudeDelta,
    maxLng: region.longitude + region.longitudeDelta
  };
}

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

// Figma 범례(*8 / *10이상 / *20이상) 기준 3단계 마커 크기.
const CLUSTER_MARKER_SIZE_TIERS = [
  { min: 20, value: 76 },
  { min: 10, value: 62 }
] as const;

function clusterMarkerSize(reportCount: number): number {
  return tieredValue(reportCount, CLUSTER_MARKER_SIZE_TIERS, 48);
}

// 마커 지름(size)에 따른 캡션/서브캡션 오프셋·글자 크기 — 원이 커질수록 텍스트도 커진다.
const CLUSTER_MARKER_CAPTION_TIERS = [
  { min: 76, value: { offset: -16, subCaptionTextSize: 19, textSize: 12 } },
  { min: 62, value: { offset: -13, subCaptionTextSize: 17, textSize: 11 } }
] as const;

function clusterMarkerCaptionStyle(size: number) {
  return tieredValue(size, CLUSTER_MARKER_CAPTION_TIERS, { offset: -10, subCaptionTextSize: 15, textSize: 10 });
}

export function MapHomeScreen() {
  const { session } = useAuth();
  const accessToken = session?.accessToken ?? null;
  const mapRef = useRef<NaverMapViewRef>(null);
  const myInfoApi = useMyInfoApi();
  const placeApi = usePlaceApi();
  const obstacleReportApi = useObstacleReportApi();
  const loadProfile = useCallback(() => myInfoApi.getProfile(), [myInfoApi]);
  const profile = useAsyncResource(loadProfile, "내 정보를 불러오지 못했어요. 다시 시도해주세요.");
  const nickname = profile.data?.nickname;

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [clusters, setClusters] = useState<ObstacleReportCluster[]>([]);
  const [clusterError, setClusterError] = useState<string | null>(null);

  const [selectedMobilityTypes, setSelectedMobilityTypes] = useState<Set<MobilityType>>(new Set());
  const [selectedAvoidIssueTypes, setSelectedAvoidIssueTypes] = useState<Set<ObstacleIssueType>>(new Set());

  const [nearbySummary, setNearbySummary] = useState<NearbyAccessibilitySummary | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<PlaceSearchItem[]>([]);
  const [recentlyViewedPlaces, setRecentlyViewedPlaces] = useState<RecentlyViewedPlace[]>([]);

  // BE는 정수 zoom으로 클러스터링 여부를 결정하므로, FE도 반올림한 같은 값으로 줌 구간을 판정해야
  // 마커(BE 응답)와 바텀시트 콘텐츠(FE 판정)가 서로 다른 zoom 기준으로 어긋나지 않는다.
  const roundedZoom = Math.round(viewport?.zoom ?? DEFAULT_ZOOM);
  const zoomTier: ZoomTier = getZoomTier(roundedZoom);

  useEffect(() => {
    let cancelled = false;

    getRecentlyViewedPlaces().then((places) => {
      if (!cancelled) {
        setRecentlyViewedPlaces(places);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // 클러스터 재조회: 카메라가 대기 상태(onCameraIdle)가 될 때, 그리고 필터가 바뀔 때.
  useEffect(() => {
    if (!viewport || !accessToken) {
      return;
    }
    const currentViewport = viewport;
    let cancelled = false;

    async function loadClusters() {
      setClusterError(null);
      try {
        const result = await obstacleReportApi.getClusters(
          regionToBbox(currentViewport.region),
          roundedZoom,
          {
            mobilityTypes: Array.from(selectedMobilityTypes),
            avoid: Array.from(selectedAvoidIssueTypes)
          }
        );
        if (!cancelled) {
          setClusters(result);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error("[MapHomeScreen] failed to load obstacle clusters", error);
          setClusterError("제보 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
        }
      }
    }

    loadClusters();

    return () => {
      cancelled = true;
    };
  }, [viewport, accessToken, selectedMobilityTypes, selectedAvoidIssueTypes, roundedZoom, obstacleReportApi]);

  // "추천 관광지"는 줌 구간과 무관하게 항상 불러온다. "현재 화면 접근성 현황" 요약 카드는
  // 먼 줌 전용이라 아래 Promise.all에서 far일 때만 조건부로 호출한다.
  useEffect(() => {
    if (!viewport || !accessToken) {
      return;
    }
    const latitude = viewport.center.latitude;
    const longitude = viewport.center.longitude;
    const currentZoomTier = zoomTier;
    const mobilityTypes = Array.from(selectedMobilityTypes);
    const avoid = Array.from(selectedAvoidIssueTypes);
    let cancelled = false;

    async function loadSummaryAndRecommendations() {
      try {
        const [summary, searchResult] = await Promise.all([
          currentZoomTier === "far"
            ? placeApi.getNearbySummary(latitude, longitude, { avoid, mobilityTypes })
            : Promise.resolve(null),
          placeApi.searchPlaces(latitude, longitude, { k: RECOMMENDED_PLACES_MAX_COUNT })
        ]);
        if (!cancelled) {
          if (summary) {
            setNearbySummary(summary);
          }
          setRecommendedPlaces(searchResult.places);
        }
      } catch {
        // 요약/추천 관광지는 보조 정보라 실패해도 지도 자체는 계속 동작해야 하므로 조용히 무시한다.
      }
    }

    loadSummaryAndRecommendations();

    return () => {
      cancelled = true;
    };
    // 의도적으로 viewport 전체가 아니라 중심 좌표만 deps로 둔다 — 같은 위치에서 줌/기울기만
    // 바뀌는 카메라 이동마다 요약/추천 관광지를 다시 불러올 필요가 없다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewport?.center.latitude,
    viewport?.center.longitude,
    accessToken,
    zoomTier,
    selectedMobilityTypes,
    selectedAvoidIssueTypes,
    placeApi
  ]);

  const handleCameraIdle = useCallback((params: Camera & { region: Region }) => {
    setViewport({
      center: { latitude: params.latitude, longitude: params.longitude },
      region: params.region,
      zoom: params.zoom ?? DEFAULT_ZOOM
    });
  }, []);

  const handleClusterTap = useCallback(
    (cluster: ObstacleReportCluster) => {
      const nextZoom = Math.min((viewport?.zoom ?? DEFAULT_ZOOM) + CLUSTER_TAP_ZOOM_STEP, MAP_MAX_ZOOM);
      mapRef.current?.animateCameraTo({
        latitude: cluster.centerLat,
        longitude: cluster.centerLng,
        zoom: nextZoom
      });
    },
    [viewport?.zoom]
  );

  const handlePlacePress = useCallback((place: PlaceSearchItem) => {
    recordPlaceView({ name: place.name, placeId: place.placeId, thumbnailUrl: place.thumbnailUrl });
    // 장소 상세 화면 연결은 이번 스코프 밖.
  }, []);

  return (
    <View style={styles.container}>
      <NaverMapView
        initialCamera={{ ...DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
        onCameraIdle={handleCameraIdle}
        ref={mapRef}
        style={styles.map}
      >
        {clusters.map((cluster, index) => {
          const key =
            cluster.id !== null
              ? `report-${String(cluster.id)}`
              : `cluster-${String(index)}-${String(cluster.centerLat)}-${String(cluster.centerLng)}`;

          if (zoomTier === "mid") {
            const dominantIssueType = cluster.topIssueTypes[0]?.issueType;
            const midSize = issueTypeMarkerSize(cluster.reportCount);
            return (
              <NaverMapMarkerOverlay
                anchor={{ x: ISSUE_TYPE_MARKER_ANCHOR_X, y: ISSUE_TYPE_MARKER_ANCHOR_Y }}
                caption={{
                  align: "Center",
                  color: issueTypeMarkerCaptionColor(cluster.reportCount),
                  text: String(cluster.reportCount),
                  textSize: ISSUE_TYPE_MARKER_CAPTION_SIZE
                }}
                height={midSize * ISSUE_TYPE_MARKER_HEIGHT_RATIO}
                image={dominantIssueType ? issueTypeMarkerIcon(dominantIssueType, cluster.reportCount) : undefined}
                isHideCollidedMarkers
                key={key}
                latitude={cluster.centerLat}
                longitude={cluster.centerLng}
                onTap={() => handleClusterTap(cluster)}
                width={midSize * ISSUE_TYPE_MARKER_WIDTH_RATIO}
                zIndex={cluster.reportCount}
              />
            );
          }

          const size = clusterMarkerSize(cluster.reportCount);
          const captionStyle = clusterMarkerCaptionStyle(size);
          return (
            <NaverMapMarkerOverlay
              anchor={{ x: 0.5, y: 0.5 }}
              caption={{
                align: "Center",
                color: "#ffffff",
                offset: captionStyle.offset,
                text: clusterSeverityLabel(cluster),
                textSize: captionStyle.textSize
              }}
              height={size}
              key={key}
              latitude={cluster.centerLat}
              longitude={cluster.centerLng}
              onTap={() => handleClusterTap(cluster)}
              subCaption={{
                color: "#ffffff",
                text: String(cluster.reportCount),
                textSize: captionStyle.subCaptionTextSize
              }}
              width={size}
            >
              <View
                collapsable={false}
                style={[
                  styles.clusterMarker,
                  { backgroundColor: clusterSeverityColor(cluster), borderRadius: size / 2, height: size, width: size }
                ]}
              />
            </NaverMapMarkerOverlay>
          );
        })}
      </NaverMapView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <View style={styles.filterRowContent}>
          {MOBILITY_TYPE_OPTIONS.map((option) => (
            <FilterChip
              Icon={option.Icon}
              key={option.value}
              label={option.label}
              onPress={() => setSelectedMobilityTypes((prev) => toggleInSet(prev, option.value))}
              selected={selectedMobilityTypes.has(option.value)}
            />
          ))}
          {ISSUE_TYPE_EXCLUDE_OPTIONS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              onPress={() => setSelectedAvoidIssueTypes((prev) => toggleInSet(prev, option.value))}
              selected={selectedAvoidIssueTypes.has(option.value)}
            />
          ))}
        </View>
      </ScrollView>

      {clusterError ? (
        <View style={styles.errorBanner}>
          <Text selectable style={styles.errorText}>
            {clusterError}
          </Text>
        </View>
      ) : null}

      <MapHomeSheet contentKey={zoomTier} title={sheetTitleFor(zoomTier)}>
        {zoomTier === "far" ? (
          <FarZoomContent
            nearbySummary={nearbySummary}
            nickname={nickname}
            onPlacePress={handlePlacePress}
            recentlyViewedPlaces={recentlyViewedPlaces}
            recommendedPlaces={recommendedPlaces}
          />
        ) : null}
        {zoomTier === "mid" ? (
          <MidZoomContent
            clusters={clusters}
            nickname={nickname}
            onPlacePress={handlePlacePress}
            recentlyViewedPlaces={recentlyViewedPlaces}
            recommendedPlaces={recommendedPlaces}
          />
        ) : null}
        {zoomTier === "close" ? (
          <CloseZoomContent
            clusters={clusters}
            nickname={nickname}
            onPlacePress={handlePlacePress}
            recentlyViewedPlaces={recentlyViewedPlaces}
            recommendedPlaces={recommendedPlaces}
          />
        ) : null}
      </MapHomeSheet>
    </View>
  );
}

function sheetTitleFor(zoomTier: ZoomTier): string {
  if (zoomTier === "far") {
    return "현재 화면 접근성 현황";
  }
  return zoomTier === "mid" ? "주변 접근성 이슈" : "현재 화면 제보";
}

type FilterChipProps = {
  readonly Icon?: ComponentType<{ color?: string; size?: number }>;
  readonly label: string;
  readonly onPress: () => void;
  readonly selected: boolean;
};

function FilterChip({ Icon, label, onPress, selected }: FilterChipProps) {
  const iconColor = selected ? colors.semantic.warning.dark : colors.text.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : null]}
    >
      {Icon ? <Icon color={iconColor} size={16} /> : null}
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: radius.full,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2]
  },
  chipSelected: {
    backgroundColor: colors.background.primary,
    borderColor: colors.semantic.warning.dark
  },
  chipText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: "600"
  },
  chipTextSelected: {
    color: colors.semantic.warning.dark
  },
  clusterMarker: {
    alignItems: "center",
    borderColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 2,
    elevation: 4,
    height: 48,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    width: 48
  },
  container: {
    flex: 1
  },
  errorBanner: {
    backgroundColor: colors.semantic.danger.light,
    left: spacing[4],
    padding: spacing[3],
    position: "absolute",
    right: spacing[4],
    top: 64
  },
  errorText: {
    color: colors.semantic.danger.dark,
    fontSize: 12
  },
  filterRow: {
    left: spacing[4],
    position: "absolute",
    right: spacing[4],
    top: spacing[6]
  },
  filterRowContent: {
    flexDirection: "row",
    gap: spacing[2]
  },
  map: {
    flex: 1
  }
});
