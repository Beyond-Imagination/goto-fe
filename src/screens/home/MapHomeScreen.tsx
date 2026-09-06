import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  type Camera,
  type Coord,
  type NaverMapViewRef,
  type Region
} from "@mj-studio/react-native-naver-map";

import { useAuth } from "@/auth";
import { Card, Text as AppText } from "@/components";
import { IconStroller } from "@/components/icons/IconStroller";
import { IconWheelchair } from "@/components/icons/IconWheelchair";
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

import { MapHomeSheet } from "./MapHomeSheet";
import {
  formatClusterMarkerLabel,
  ISSUE_TYPE_LABEL,
  NEEDS_CONFIRMATION_COLOR,
  NEEDS_CONFIRMATION_LABEL,
  SEVERITY_COLOR,
  SEVERITY_LABEL
} from "./obstacleSeverityStyle";
import { getZoomTier, type ZoomTier } from "./zoomTiers";

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
function clusterMarkerSize(reportCount: number): number {
  if (reportCount >= 20) {
    return 76;
  }
  if (reportCount >= 10) {
    return 62;
  }
  return 48;
}

function formatRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${String(diffMinutes)}분 전`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${String(diffHours)}시간 전`;
  }
  return `${String(Math.round(diffHours / 24))}일 전`;
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
          console.error("[MapHomeScreen] failed to load obstacle clusters", error);
          setClusterError("제보 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
        }
      }
    }

    loadClusters();

    return () => {
      cancelled = true;
    };
  }, [viewport, accessToken, selectedMobilityTypes, selectedAvoidIssueTypes, roundedZoom, obstacleReportApi]);

  // 먼 줌 / 가까운 줌 전용 바텀시트 데이터: "현재 화면 접근성 현황" + "추천 관광지".
  // 중간 줌은 클러스터 응답의 nearbyPlaceLabel만으로 콘텐츠를 구성하므로 별도 호출이 필요 없다.
  useEffect(() => {
    if (!viewport || !accessToken || zoomTier === "mid") {
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
          const size = clusterMarkerSize(cluster.reportCount);
          return (
            <NaverMapMarkerOverlay
              anchor={{ x: 0.5, y: 0.5 }}
              caption={{
                align: "Center",
                color: "#ffffff",
                offset: size >= 76 ? -16 : size >= 62 ? -13 : -10,
                text: SEVERITY_LABEL[cluster.maxSeverity],
                textSize: size >= 76 ? 12 : size >= 62 ? 11 : 10
              }}
              height={size}
              key={
                cluster.id !== null
                  ? `report-${String(cluster.id)}`
                  : `cluster-${String(index)}-${String(cluster.centerLat)}-${String(cluster.centerLng)}`
              }
              latitude={cluster.centerLat}
              longitude={cluster.centerLng}
              onTap={() => handleClusterTap(cluster)}
              subCaption={{
                color: "#ffffff",
                text: String(cluster.reportCount),
                textSize: size >= 76 ? 19 : size >= 62 ? 17 : 15
              }}
              width={size}
            >
              <View
                collapsable={false}
                style={[
                  styles.clusterMarker,
                  { backgroundColor: SEVERITY_COLOR[cluster.maxSeverity], borderRadius: size / 2, height: size, width: size }
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
        {zoomTier === "mid" ? <MidZoomContent clusters={clusters} /> : null}
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

type FarZoomContentProps = {
  readonly nearbySummary: NearbyAccessibilitySummary | null;
  readonly nickname: string | undefined;
  readonly onPlacePress: (place: PlaceSearchItem) => void;
  readonly recentlyViewedPlaces: readonly RecentlyViewedPlace[];
  readonly recommendedPlaces: readonly PlaceSearchItem[];
};

function FarZoomContent({
  nearbySummary,
  nickname,
  onPlacePress,
  recentlyViewedPlaces,
  recommendedPlaces
}: FarZoomContentProps) {
  return (
    <View style={styles.sections}>
      {nearbySummary ? <AccessibilitySummaryCard summary={nearbySummary} /> : null}
      <RecommendedPlacesSection nickname={nickname} onPlacePress={onPlacePress} places={recommendedPlaces} />
      <RecentlyViewedPlacesSection places={recentlyViewedPlaces} />
    </View>
  );
}

function AccessibilitySummaryCard({ summary }: { readonly summary: NearbyAccessibilitySummary }) {
  return (
    <Card elevation="sm" style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <SummaryCount color={SEVERITY_COLOR.INFO} count={summary.safeCount} label={SEVERITY_LABEL.INFO} />
        <View style={styles.summaryDivider} />
        <SummaryCount color={SEVERITY_COLOR.CAUTION} count={summary.cautionCount} label={SEVERITY_LABEL.CAUTION} />
        <View style={styles.summaryDivider} />
        <SummaryCount
          color={SEVERITY_COLOR.IMPASSABLE}
          count={summary.detourRecommendedCount}
          label={SEVERITY_LABEL.IMPASSABLE}
        />
        <View style={styles.summaryDivider} />
        <SummaryCount color={NEEDS_CONFIRMATION_COLOR} count={summary.needsConfirmationCount} label={NEEDS_CONFIRMATION_LABEL} />
      </View>
    </Card>
  );
}

function SummaryCount({ color, count, label }: { readonly color: string; readonly count: number; readonly label: string }) {
  return (
    <View style={styles.summaryCount}>
      <AppText color={color} variant="title-2" weight="bold">
        {String(count)}
        <AppText color={colors.text.secondary} variant="body-2" weight="regular">
          건
        </AppText>
      </AppText>
      <AppText color={colors.text.secondary} variant="caption-1">
        {label}
      </AppText>
    </View>
  );
}

type MidZoomContentProps = {
  readonly clusters: readonly ObstacleReportCluster[];
};

function MidZoomContent({ clusters }: MidZoomContentProps) {
  const labeledClusters = clusters.filter((cluster) => cluster.nearbyPlaceLabel !== null);

  if (labeledClusters.length === 0) {
    return (
      <AppText color={colors.text.secondary} variant="body-3">
        이 주변에 표시할 접근성 이슈가 없어요.
      </AppText>
    );
  }

  return (
    <View style={styles.sections}>
      {labeledClusters.map((cluster, index) => (
        <Card elevation="sm" key={`${String(cluster.centerLat)}-${String(cluster.centerLng)}-${String(index)}`}>
          <View style={styles.issueRow}>
            <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[cluster.maxSeverity] }]} />
            <View style={styles.issueTextGroup}>
              <AppText variant="body-2" weight="semibold">
                {cluster.nearbyPlaceLabel}
              </AppText>
              <AppText color={colors.text.secondary} variant="caption-1">
                {formatClusterMarkerLabel(cluster.maxSeverity, cluster.reportCount)}
              </AppText>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

type CloseZoomContentProps = {
  readonly clusters: readonly ObstacleReportCluster[];
  readonly nickname: string | undefined;
  readonly onPlacePress: (place: PlaceSearchItem) => void;
  readonly recentlyViewedPlaces: readonly RecentlyViewedPlace[];
  readonly recommendedPlaces: readonly PlaceSearchItem[];
};

function CloseZoomContent({
  clusters,
  nickname,
  onPlacePress,
  recentlyViewedPlaces,
  recommendedPlaces
}: CloseZoomContentProps) {
  // 가까운 줌은 언클러스터링 상태라 클러스터 하나 = 제보 하나. topIssueTypes를 합산하면
  // 뷰포트 전체의 유형별 분포가 정확히 나온다(각 클러스터가 이미 리포트 1건이라 손실 없음).
  const issueTypeCounts = new Map<ObstacleIssueType, number>();
  let totalCount = 0;
  for (const cluster of clusters) {
    for (const entry of cluster.topIssueTypes) {
      issueTypeCounts.set(entry.issueType, (issueTypeCounts.get(entry.issueType) ?? 0) + entry.count);
      totalCount += entry.count;
    }
  }
  const breakdown = Array.from(issueTypeCounts.entries()).sort((a, b) => b[1] - a[1]);

  const reportItems = clusters
    .filter((cluster) => cluster.id !== null)
    .slice()
    .sort((a, b) => new Date(b.latestReportAt).getTime() - new Date(a.latestReportAt).getTime());

  return (
    <View style={styles.sections}>
      {totalCount > 0 ? (
        <Card elevation="sm">
          <AppText style={styles.sectionHeading} variant="title-2" weight="semibold">
            {totalCount}건 · 이 지역에서 확인된 접근성 제보 수
          </AppText>
          <View style={styles.breakdownList}>
            {breakdown.map(([issueType, count]) => (
              <View key={issueType} style={styles.breakdownRow}>
                <AppText style={styles.breakdownLabel} variant="body-3">
                  {ISSUE_TYPE_LABEL[issueType]}
                </AppText>
                <AppText color={colors.text.secondary} variant="body-3">
                  {count}건 · {Math.round((count / totalCount) * 100)}%
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <View style={styles.sections}>
        <AppText style={styles.sectionHeading} variant="title-2" weight="semibold">
          최근 제보
        </AppText>
        {reportItems.length === 0 ? (
          <AppText color={colors.text.secondary} variant="body-3">
            이 화면에 표시할 제보가 없어요.
          </AppText>
        ) : (
          reportItems.map((cluster) => (
            <Card elevation="sm" key={`report-${String(cluster.id)}`}>
              <View style={styles.issueRow}>
                <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[cluster.maxSeverity] }]} />
                <View style={styles.issueTextGroup}>
                  <AppText variant="body-2" weight="semibold">
                    {cluster.topIssueTypes[0]
                      ? ISSUE_TYPE_LABEL[cluster.topIssueTypes[0].issueType]
                      : SEVERITY_LABEL[cluster.maxSeverity]}
                  </AppText>
                  <AppText color={colors.text.secondary} variant="caption-1">
                    {cluster.nearbyPlaceLabel ?? "주변 장소 정보 없음"} · {formatRelativeTime(cluster.latestReportAt)}
                  </AppText>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      <RecommendedPlacesSection nickname={nickname} onPlacePress={onPlacePress} places={recommendedPlaces} />
      <RecentlyViewedPlacesSection places={recentlyViewedPlaces} />
    </View>
  );
}

type RecommendedPlacesSectionProps = {
  readonly nickname: string | undefined;
  readonly onPlacePress: (place: PlaceSearchItem) => void;
  readonly places: readonly PlaceSearchItem[];
};

const RECOMMENDED_PLACES_INITIAL_COUNT = 4;
const RECOMMENDED_PLACES_PAGE_SIZE = 6;
// 진짜 페이지네이션(offset) 없이 상위 K개를 한 번에 받아와 클라이언트에서 순차 공개한다 — 이 값이 노출 가능한 최대 순위다.
const RECOMMENDED_PLACES_MAX_COUNT = 15;

function RecommendedPlacesSection({ nickname, onPlacePress, places }: RecommendedPlacesSectionProps) {
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
    <View style={styles.sections}>
      <AppText style={styles.sectionHeading} variant="title-2" weight="semibold">
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
        {visiblePlaces.map((place, index) => (
          <Pressable
            accessibilityLabel={`${String(index + 1)}위 ${place.name}, 여기서 ${(place.distanceMeters / 1000).toFixed(1)}km`}
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
                여기서 {(place.distanceMeters / 1000).toFixed(1)}km
              </AppText>
            </ImageBackground>
          </Pressable>
        ))}
      </View>
      {hasMore || visibleCount > RECOMMENDED_PLACES_INITIAL_COUNT ? (
        <Pressable
          onPress={() =>
            hasMore ? setVisibleCount(nextCount) : setVisibleCount(RECOMMENDED_PLACES_INITIAL_COUNT)
          }
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

function RecentlyViewedPlacesSection({ places }: { readonly places: readonly RecentlyViewedPlace[] }) {
  if (places.length === 0) {
    return null;
  }

  return (
    <View style={styles.sections}>
      <AppText style={styles.sectionHeading} variant="title-2" weight="semibold">
        최근 조회한 장소
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.recentPlaceRow}>
          {places.map((place) => (
            <View key={place.placeId} style={styles.recentPlaceCard}>
              <ImageBackground
                imageStyle={styles.recentPlaceImage}
                source={place.thumbnailUrl ? { uri: place.thumbnailUrl } : undefined}
                style={[styles.recentPlaceImage, styles.recentPlaceImageWrapper]}
              />
              <AppText numberOfLines={1} style={styles.recentPlaceName} variant="caption-1" weight="semibold">
                {place.name}
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  breakdownLabel: {
    flex: 1
  },
  breakdownList: {
    gap: spacing[2],
    marginTop: spacing[3]
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
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
  issueRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  },
  issueTextGroup: {
    flex: 1,
    gap: spacing[1]
  },
  map: {
    flex: 1
  },
  placeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3]
  },
  recentPlaceRow: {
    flexDirection: "row",
    gap: spacing[3]
  },
  recentPlaceCard: {
    width: 108
  },
  recentPlaceImage: {
    borderRadius: radius.lg
  },
  recentPlaceImageWrapper: {
    aspectRatio: 1,
    backgroundColor: colors.background.regular
  },
  recentPlaceName: {
    marginTop: spacing[1]
  },
  placeCard: {
    width: "47%"
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
  placeCardHeader: {
    alignItems: "flex-start",
    flexDirection: "column"
  },
  placeCardBadgeText: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3
  },
  placeCardTitle: {
    alignSelf: "stretch",
    // headline-2/body-1 모두 줄간격이 실제 글자 높이보다 커서, 음수 margin으로 그 여백을 상쇄한다.
    marginTop: -8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3
  },
  placeCardDistance: {
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 3
  },
  placeMoreButton: {
    alignItems: "center",
    borderColor: colors.border.regular,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingVertical: spacing[2]
  },
  sectionHeading: {
    marginBottom: spacing[1]
  },
  sections: {
    gap: spacing[4]
  },
  severityDot: {
    borderRadius: 6,
    height: 12,
    width: 12
  },
  summaryCard: {
    borderWidth: 0,
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0
  },
  summaryCount: {
    alignItems: "center",
    flex: 1,
    gap: spacing[1]
  },
  summaryDivider: {
    alignSelf: "stretch",
    backgroundColor: colors.border.light,
    marginVertical: spacing[1],
    width: 1
  },
  summaryRow: {
    flexDirection: "row"
  }
});
