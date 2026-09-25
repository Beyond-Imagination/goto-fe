import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import {
  NaverMapMarkerOverlay,
  NaverMapView,
  type Camera,
  type Coord,
  type NaverMapViewRef,
  type Region
} from "@mj-studio/react-native-naver-map";
import Svg, { Path } from "react-native-svg";

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
  type PlaceDetail,
  type PlaceDetailRowKey,
  type PlaceDetailRowStatus,
  type PlaceDetailRowValue,
  type PlaceSearchItem
} from "@/placeApi";
import { useObstacleReportApi } from "@/useObstacleReportApi";
import { usePlaceApi } from "@/usePlaceApi";
import { FALLBACK_COORDINATES, getCurrentCoordinates } from "@/help/currentLocation";
import { useAsyncResource, useMyInfoApi } from "@/myinfo";
import { useSavedPlaceApi } from "@/saved";
import { getRecentlyViewedPlaces, recordPlaceView, type RecentlyViewedPlace } from "@/state/recentlyViewedPlaces";

import {
  ISSUE_TYPE_MARKER_ANCHOR_X,
  ISSUE_TYPE_MARKER_ANCHOR_Y,
  ISSUE_TYPE_MARKER_CAPTION_SIZE,
  ISSUE_TYPE_MARKER_HEIGHT_RATIO,
  ISSUE_TYPE_MARKER_WIDTH_RATIO,
  ISSUE_TYPE_PIN_MARKER,
  issueTypeMarkerCaptionColor,
  issueTypeMarkerIcon,
  issueTypeMarkerSize,
  issueTypePinIcon
} from "./issueTypeMarkerIcons";
import { MapHomeSheet } from "./MapHomeSheet";
import { ISSUE_TYPE_LABEL, clusterDominantIssueType, clusterSeverityColor, clusterSeverityLabel } from "./obstacleSeverityStyle";
import { RECOMMENDED_PLACES_MAX_COUNT } from "./sections/RecommendedPlacesSection";
import { tieredValue } from "./tieredValue";
import { getZoomTier, type ZoomTier } from "./zoomTiers";
import { CloseZoomContent } from "./zoomContent/CloseZoomContent";
import { FarZoomContent } from "./zoomContent/FarZoomContent";
import { MidZoomContent } from "./zoomContent/MidZoomContent";

// ????μ떜媛?걫?繹먃???????獄쏅챶留???????????????袁④뎬???????ш낄???????궰??????繹먮끍?????????獄쏅챶留덌┼???猿녿퉲??????????????獄쏅챶留??(???轅붽틓?????얜?異??????.
const DEFAULT_CENTER: Coord = { latitude: 37.5665, longitude: 126.978 };
const DEFAULT_ZOOM = 11;
const CLUSTER_TAP_ZOOM_STEP = 3;
const MAP_MAX_ZOOM = 21;
const SEARCH_RESULT_LIMIT = 5;

const TEXT = {
  addressMissing: "\uC8FC\uC18C \uC815\uBCF4 \uC5C6\uC74C",
  categoryFallback: "\uC7A5\uC18C",
  closePlace: "\uC7A5\uC18C \uC120\uD0DD \uB2EB\uAE30",
  closeSearch: "\uAC80\uC0C9\uCC3D \uB2EB\uAE30",
  clearSearch: "\uAC80\uC0C9\uC5B4 \uC9C0\uC6B0\uAE30",
  detail: "\uC0C1\uC138\uBCF4\uAE30",
  loadingSearch: "\uAC80\uC0C9 \uACB0\uACFC\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC774\uC5D0\uC694.",
  noSearchResults: "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC5B4\uC694.",
  place: "\uAD00\uAD11\uC9C0",
  recentChecked: "\uCD5C\uADFC \uD655\uC778\uB428",
  report: "\uC81C\uBCF4",
  route: "\uAE38\uCC3E\uAE30",
  savePlace: "\uC7A5\uC18C \uC800\uC7A5",
  unsavePlace: "\uC7A5\uC18C \uC800\uC7A5 \uD574\uC81C",
  searchHere: "\uD604 \uC9C0\uB3C4\uC5D0\uC11C \uAC80\uC0C9",
  searchPlaces: "\uC7A5\uC18C \uAC80\uC0C9",
  searchPlaceholder: "\uC7A5\uC18C\uB97C \uAC80\uC0C9\uD574\uBCF4\uC138\uC694",
  searchRetryMessage: "\uAC80\uC0C9 \uACB0\uACFC\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694."
} as const;

const MOBILITY_TYPE_OPTIONS: {
  value: MobilityType;
  label: string;
  Icon?: ComponentType<{ color?: string; size?: number }>;
}[] = [
  { Icon: IconWheelchair, label: "\uD720\uCCB4\uC5B4", value: "WHEELCHAIR" },
  { Icon: IconStroller, label: "\uC720\uBAA8\uCC28", value: "STROLLER" },
  { label: "\uC11C\uD589", value: "SLOW_WALKER" }
];

const ISSUE_TYPE_EXCLUDE_OPTIONS: { value: ObstacleIssueType; label: string }[] = [
  { value: "HIGH_CURB", label: "\uB192\uC740 \uD131 \uC81C\uC678" },
  { value: "STAIRS", label: "\uACC4\uB2E8 \uC81C\uC678" },
  { value: "STEEP_SLOPE", label: "\uAE09\uACBD\uC0AC \uC81C\uC678" }
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

// Figma ???????(*8 / *10???????/ *20??????? ??????? 3?????????????耀붾굝?????????寃밴콞?????
const CLUSTER_MARKER_SIZE_TIERS = [
  { min: 20, value: 76 },
  { min: 10, value: 62 }
] as const;

function clusterMarkerSize(reportCount: number): number {
  return tieredValue(reportCount, CLUSTER_MARKER_SIZE_TIERS, 48);
}

// ?耀붾굝?????????寃밴콞??耀붾굝???????size)?????????딅즶???耀붾굝????곌랬?????????轅붽틓?????筌뤿굝萸?耀붾굝????곌랬??????????????????룸챷援??????????????????傭?끆??????猷???????????癲ル슢??????饔낅떽?????怨뚰뇞泳????傭?끆??????猷???
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
  const profile = useAsyncResource(loadProfile, "????꿔꺂???????????怨쀫뎐????? ?轅붽틓??彛?臾믪뮏?鶯?????쇨덧?? ?????ㅻ쿋????癲ル슢???????觀????꿔꺂?????");
  const nickname = profile.data?.nickname;

  const [viewport, setViewport] = useState<Viewport | null>(null);
  const [clusters, setClusters] = useState<ObstacleReportCluster[]>([]);
  const [clusterError, setClusterError] = useState<string | null>(null);

  const [selectedMobilityTypes, setSelectedMobilityTypes] = useState<Set<MobilityType>>(new Set());
  const [selectedAvoidIssueTypes, setSelectedAvoidIssueTypes] = useState<Set<ObstacleIssueType>>(new Set());

  const [nearbySummary, setNearbySummary] = useState<NearbyAccessibilitySummary | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<PlaceSearchItem[]>([]);
  const [recentlyViewedPlaces, setRecentlyViewedPlaces] = useState<RecentlyViewedPlace[]>([]);
  const [searchText, setSearchText] = useState("");
  const [activeSearchKeyword, setActiveSearchKeyword] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PlaceSearchItem[]>([]);
  const [selectedSearchPlaceId, setSelectedSearchPlaceId] = useState<number | null>(null);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [searchError, setSearchError] = useState<string | null>(null);

  // BE????饔낅떽???????zoom???????????????????밸븶???⑸꺊?????????汝뷴젆?琉???????? FE???????밸븶筌믩끃??????沅걔??????꿔꺂??濡⑷괌?遺떷??????ル뒌??? ?????ル뒌???????????????????????????源낆쭍??
  // ?耀붾굝?????????寃밴콞?BE ????????? ?????밸븶筌믩끃????????????????諛몃마??????FE ??????????ル뒌?? ???轅붽틓?????饔낅㈇?????????낇뀘??zoom ???????????????????μ떜媛?걫??곷퉺???? ???????용봾鍮??
  const roundedZoom = Math.round(viewport?.zoom ?? DEFAULT_ZOOM);
  const zoomTier: ZoomTier = getZoomTier(roundedZoom);
  const selectedSearchPlace =
    activeSearchKeyword && selectedSearchPlaceId
      ? searchResults.find((place) => place.placeId === selectedSearchPlaceId) ?? null
      : null;

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

  // ???????????밸븶??????? ?????몃뱥?????? ??????????거?뜮??onCameraIdle)?????ル뒌?? ???? ?????醫딇떍?????嶺???????ш내?℡ㅇ????븐뼐爰끾납?????????쎛 ?????밸븶筌믩끃???????
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
          setClusterError("??癲ル슢??????꿔꺂???????????怨쀫뎐????? ?轅붽틓??彛?臾믪뮏?鶯?????쇨덧?? ??????뷂┼????????ㅻ쿋????癲ル슢???????觀????꿔꺂?????");
        }
      }
    }

    loadClusters();

    return () => {
      cancelled = true;
    };
  }, [viewport, accessToken, selectedMobilityTypes, selectedAvoidIssueTypes, roundedZoom, obstacleReportApi]);

  // "??????꾨굴????????怨멸텛?????????"???????????????癲ル슢??節덈빝?????????산뭐???????????Β?ル윲?????????⑥ъ죩. "?????獄쏅챶留??????椰?壤?????????ロ렰????????ш내?℡ㅇ?? ????椰????????몃뱥?????
  // ?????????獄쏅챶留???????????獄쏅챶留??Promise.all?????far???????????⑥ル?????????嫄????援온?????饔낅떽????????轅붽틓?????
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
        // ????椰?????????꾨굴????????怨멸텛????????????????곕츥??????饔낅떽????????????????ㅼ뒩???????耀붾굝???????????????傭?끆???????????嚥싲갭횧??㏓뙀??????源낆쭍???????????⑥ル?????????癲ル슢캉??????轅붽틓?????
      }
    }

    loadSummaryAndRecommendations();

    return () => {
      cancelled = true;
    };
    // ???黎앸럽???????????살몝?轅붽틓??筌뚮랭沅??viewport ?????獄쏅챶留???癰????????쎛 ?????獄쏅챶留?????????袁ⓦ걤???ш낄猷????????誘⑺떜???????濚왿뫅彛?deps??????椰??????????ル뒌??? ?????獄쏅챶留??????????????????沅걔?癲????????⑤벡???
    // ?????밸븶筌믩끃?????????????몃뱥?????????????嶺뚮　維????????곸죩 ????椰?????????꾨굴????????怨멸텛??????????????????댄뱼???????Β?ル윲?????????獄쏅챶留???????뀀??????쎛 ????癲ル슢?뤸뤃??
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

  const runPlaceSearch = useCallback(async () => {
    const keyword = searchText.trim();
    if (!keyword) {
      return;
    }

    const fallbackCenter = viewport?.center ?? DEFAULT_CENTER;
    setActiveSearchKeyword(keyword);
    setSearchState("loading");
    setSearchError(null);

    try {
      const currentCoordinates = await getCurrentCoordinates();
      const searchOrigin =
        currentCoordinates.latitude === FALLBACK_COORDINATES.latitude &&
        currentCoordinates.longitude === FALLBACK_COORDINATES.longitude
          ? fallbackCenter
          : currentCoordinates;
      const result = await placeApi.searchPlaces(searchOrigin.latitude, searchOrigin.longitude, {
        avoid: Array.from(selectedAvoidIssueTypes),
        k: SEARCH_RESULT_LIMIT,
        keyword,
        mobilityTypes: Array.from(selectedMobilityTypes)
      });
      setSearchResults(result.places);
      setSelectedSearchPlaceId(null);
      setSearchState("success");

      const firstPlace = result.places[0];
      if (firstPlace) {
        mapRef.current?.animateCameraTo({
          latitude: firstPlace.latitude,
          longitude: firstPlace.longitude,
          zoom: Math.max(viewport?.zoom ?? DEFAULT_ZOOM, 15)
        });
      }
    } catch (error) {
      logger.error("[MapHomeScreen] failed to search places", error);
      setSearchResults([]);
      setSelectedSearchPlaceId(null);
      setSearchState("error");
      setSearchError(TEXT.searchRetryMessage);
    }
  }, [placeApi, searchText, selectedAvoidIssueTypes, selectedMobilityTypes, viewport]);

  const clearSearch = useCallback(() => {
    setSearchText("");
    setActiveSearchKeyword(null);
    setSearchResults([]);
    setSelectedSearchPlaceId(null);
    setSearchState("idle");
    setSearchError(null);
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
    setSelectedSearchPlaceId(place.placeId);
    recordPlaceView({ name: place.name, placeId: place.placeId, thumbnailUrl: place.thumbnailUrl });
    mapRef.current?.animateCameraTo({
      latitude: place.latitude,
      longitude: place.longitude,
      zoom: Math.max(viewport?.zoom ?? DEFAULT_ZOOM, 16)
    });
    // ?????????筌뤾퍓愿??????椰?壤????????⑤벡瑜??? ?????????癲?????
  }, [viewport?.zoom]);

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
            const dominantIssueType = clusterDominantIssueType(cluster);
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

          if (zoomTier === "close") {
            // 가까운 줌은 언클러스터링 상태라 클러스터 하나 = 제보 하나(CloseZoomContent.tsx
            // 참고) — 그래서 건수 구간 없이 이슈유형 하나만으로 pin 이미지가 정해진다.
            // 대표 이슈유형이 없거나 FE가 모르는 값이면 아래 공용 원형 마커 분기로 그대로
            // 흘러 내려가 폴백된다.
            const dominantIssueType = clusterDominantIssueType(cluster);
            if (dominantIssueType) {
              return (
                <NaverMapMarkerOverlay
                  anchor={ISSUE_TYPE_PIN_MARKER.anchor}
                  // 기획(가까운 줌 목업)엔 pin 위에 이슈유형 이름표가 항상 같이 붙어있다.
                  // align:"Top"은 이미 mid 줌 캡션(align:"Center")과 같은 네이티브 caption
                  // 렌더 경로를 타므로 안전하고, offset은 그 mid 줌 쪽에서 "지정하면 캡션이
                  // 아예 안 그려지는" 버그가 확인돼 건드리지 않는다(issueTypeMarkerIcons.ts
                  // ISSUE_TYPE_MARKER_ANCHOR_X 주석 참고) — 기본 간격을 그대로 쓴다.
                  caption={{
                    align: "Top",
                    color: colors.text.inverse,
                    haloColor: ISSUE_TYPE_PIN_MARKER.labelHaloColor,
                    text: ISSUE_TYPE_LABEL[dominantIssueType],
                    textSize: ISSUE_TYPE_PIN_MARKER.labelTextSize
                  }}
                  height={ISSUE_TYPE_PIN_MARKER.height}
                  image={issueTypePinIcon(dominantIssueType)}
                  isHideCollidedMarkers
                  key={key}
                  latitude={cluster.centerLat}
                  longitude={cluster.centerLng}
                  onTap={() => handleClusterTap(cluster)}
                  width={ISSUE_TYPE_PIN_MARKER.width}
                  zIndex={cluster.reportCount}
                />
              );
            }
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
        {activeSearchKeyword
          ? searchResults.map((place, index) => {
              const selected = selectedSearchPlaceId === place.placeId;
              const zIndex = selected ? 2000 + index : 1000 + index;
              return [
                <NaverMapMarkerOverlay
                  anchor={{ x: 0.5, y: 1 }}
                  height={56}
                  key={`search-place-pin-${String(place.placeId)}`}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  onTap={() => handlePlacePress(place)}
                  width={45}
                  zIndex={zIndex}
                >
                  <SearchPlaceMarker index={index + 1} selected={selected} />
                </NaverMapMarkerOverlay>,
                <NaverMapMarkerOverlay
                  anchor={{ x: 0.5, y: 0 }}
                  height={38}
                  key={`search-place-label-${String(place.placeId)}`}
                  latitude={place.latitude}
                  longitude={place.longitude}
                  width={132}
                  zIndex={zIndex - 1}
                >
                  <SearchPlaceMarkerLabel name={place.name} />
                </NaverMapMarkerOverlay>
              ];
            })
          : null}
      </NaverMapView>

      <View pointerEvents="box-none" style={styles.searchOverlay}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Pressable
              accessibilityLabel={TEXT.closeSearch}
              accessibilityRole="button"
              hitSlop={spacing[2]}
              onPress={clearSearch}
              style={styles.searchBackButton}
            >
              <Image resizeMode="contain" source={require("../../assets/logo-mark.png")} style={styles.searchLogoMark} />
            </Pressable>
            <TextInput
              accessibilityLabel={TEXT.searchPlaces}
              enterKeyHint="search"
              onChangeText={setSearchText}
              onSubmitEditing={runPlaceSearch}
              placeholder={TEXT.searchPlaceholder}
              placeholderTextColor={colors.text.tertiary}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchText}
            />
            <Pressable
              accessibilityLabel={TEXT.clearSearch}
              accessibilityRole="button"
              hitSlop={spacing[2]}
              onPress={clearSearch}
              style={styles.searchClearButton}
            >
              <Text style={styles.searchClearText}>{"\u00D7"}</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => {}}
            style={styles.searchSubmitButton}
          >
            <RouteArrowIcon />
            <Text style={styles.searchSubmitText}>{TEXT.route}</Text>
          </Pressable>
        </View>
        {activeSearchKeyword ? (
          <Pressable
            accessibilityRole="button"
            disabled={searchState === "loading"}
            onPress={runPlaceSearch}
            style={styles.searchHereButton}
          >
            <Text style={styles.searchHereIcon}>{"\u21BB"}</Text>
            <Text style={styles.searchHereText}>{TEXT.searchHere}</Text>
          </Pressable>
        ) : null}
      </View>

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

      <MapHomeSheet
        contentKey={
          activeSearchKeyword
            ? `search-${activeSearchKeyword}-${String(selectedSearchPlaceId ?? "list")}`
            : zoomTier
        }
        title={
          activeSearchKeyword && selectedSearchPlace
            ? ""
            : activeSearchKeyword
              ? activeSearchKeyword + " \uAC80\uC0C9 \uACB0\uACFC " + String(searchResults.length) + "\uAC74"
              : sheetTitleFor(zoomTier)
        }
      >
        {activeSearchKeyword && selectedSearchPlace ? (
          <SelectedSearchPlaceContent
            key={selectedSearchPlace.placeId}
            onClose={() => setSelectedSearchPlaceId(null)}
            place={selectedSearchPlace}
          />
        ) : null}
        {activeSearchKeyword && !selectedSearchPlace ? (
          <SearchResultsContent
            errorMessage={searchError}
            onPlacePress={handlePlacePress}
            places={searchResults}
            selectedPlaceId={selectedSearchPlaceId}
            state={searchState}
          />
        ) : null}
        {!activeSearchKeyword && zoomTier === "far" ? (
          <FarZoomContent
            nearbySummary={nearbySummary}
            nickname={nickname}
            onPlacePress={handlePlacePress}
            recentlyViewedPlaces={recentlyViewedPlaces}
            recommendedPlaces={recommendedPlaces}
          />
        ) : null}
        {!activeSearchKeyword && zoomTier === "mid" ? (
          <MidZoomContent
            clusters={clusters}
            nickname={nickname}
            onPlacePress={handlePlacePress}
            recentlyViewedPlaces={recentlyViewedPlaces}
            recommendedPlaces={recommendedPlaces}
          />
        ) : null}
        {!activeSearchKeyword && zoomTier === "close" ? (
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
    return "\uD604\uC7AC \uD654\uBA74 \uC811\uADFC\uC131 \uD604\uD669";
  }
  if (zoomTier === "mid") {
    return "\uC8FC\uBCC0 \uC811\uADFC\uC131 \uC774\uC288";
  }
  // close: CurrentScreenReportStatsCard\uAC00 "\uD604\uC7AC \uD654\uBA74 \uC81C\uBCF4" + \u24D8\uB97C \uCE74\uB4DC \uC548\uC5D0\uC11C \uC9C1\uC811 \uADF8\uB9B0\uB2E4 \u2014
  // \uC5EC\uAE30\uC11C \uB610 \uAC19\uC740 \uC81C\uBAA9\uC744 \uB744\uC6B0\uBA74 \uB450 \uC904\uB85C \uACB9\uCCD0 \uBCF4\uC778\uB2E4(\uC911\uBCF5 \uD5E4\uB354 \uBC84\uADF8, \uC774\uC804\uC5D0 \uD55C \uBC88 \uACE0\uCCE4\uC74C).
  return "";
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

type SearchPlaceMarkerProps = {
  readonly index: number;
  readonly selected: boolean;
};

function SearchPlaceMarker({ index, selected }: SearchPlaceMarkerProps) {
  const fillColor = selected ? colors.brand.mainAlt : colors.background.primary;
  const textColor = selected ? colors.text.inverse : colors.brand.mainAlt;

  return (
    <View collapsable={false} style={styles.placeMarkerShape}>
      <Svg height={56} viewBox="0 0 64 80" width={45}>
        <Path
          d="M32 2C17.64 2 6 13.64 6 28c0 18.76 20.54 39.38 25.02 43.64a1.42 1.42 0 0 0 1.96 0C37.46 67.38 58 46.76 58 28C58 13.64 46.36 2 32 2Z"
          fill={fillColor}
          stroke={colors.brand.mainAlt}
          strokeLinejoin="round"
          strokeWidth={4}
        />
      </Svg>
      <Text style={[styles.placeMarkerText, { color: textColor }]}>
        {index}
      </Text>
    </View>
  );
}

function SearchPlaceMarkerLabel({ name }: { readonly name: string }) {
  return (
    <View collapsable={false} style={styles.placeMarkerLabelContainer}>
      <Text numberOfLines={2} style={styles.placeMarkerLabel}>
        {name}
      </Text>
    </View>
  );
}

function RouteArrowIcon() {
  return (
    <Svg height={26} viewBox="0 0 28 28" width={26}>
      <Path
        d="M7 22V12.5C7 9.46 9.46 7 12.5 7H22"
        fill="none"
        stroke={colors.text.inverse}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
      <Path
        d="M17 2.5L22.5 7L17 11.5"
        fill="none"
        stroke={colors.text.inverse}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={3}
      />
    </Svg>
  );
}

type SearchResultsContentProps = {
  readonly errorMessage: string | null;
  readonly onPlacePress: (place: PlaceSearchItem) => void;
  readonly places: readonly PlaceSearchItem[];
  readonly selectedPlaceId: number | null;
  readonly state: "idle" | "loading" | "success" | "error";
};

type SelectedSearchPlaceContentProps = {
  readonly onClose: () => void;
  readonly place: PlaceSearchItem;
};

function SelectedSearchPlaceContent({ onClose, place }: SelectedSearchPlaceContentProps) {
  const router = useRouter();
  const placeApi = usePlaceApi();
  const savedPlaceApi = useSavedPlaceApi();
  const [showDetails, setShowDetails] = useState(false);
  const [detail, setDetail] = useState<PlaceDetail | null>(null);
  const [detailPlaceId, setDetailPlaceId] = useState<number | null>(null);
  const [detailLoadState, setDetailLoadState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasDetailForSelectedPlace = detailPlaceId === place.placeId;
  const selectedBadges = hasDetailForSelectedPlace && detail ? detail.badges : [];

  const loadDetail = useCallback(async (options?: { readonly reveal?: boolean }) => {
    if (options?.reveal) {
      setShowDetails(true);
    }
    if (detailPlaceId === place.placeId && detail && detailLoadState === "success") {
      return;
    }
    setDetailPlaceId(place.placeId);
    setDetailLoadState("loading");
    setDetailError(null);
    try {
      const response = await placeApi.getPlaceDetail(place.placeId);
      setDetail(response);
      setDetailLoadState("success");
    } catch (error) {
      logger.error("[MapHomeScreen] failed to load place detail", error);
      setDetailLoadState("error");
      setDetailError("\uC0C1\uC138 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.");
    }
  }, [detail, detailLoadState, detailPlaceId, place.placeId, placeApi]);

  useEffect(() => {
    let cancelled = false;
    async function preloadDetail() {
      setDetailPlaceId(place.placeId);
      setDetailLoadState("loading");
      try {
        const response = await placeApi.getPlaceDetail(place.placeId);
        if (!cancelled) {
          setDetail(response);
          setDetailLoadState("success");
        }
      } catch (error) {
        logger.error("[MapHomeScreen] failed to preload place detail", error);
        if (!cancelled) {
          setDetailLoadState("error");
          setDetailError("\uC0C1\uC138 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.");
        }
      }
    }

    void preloadDetail();
    return () => {
      cancelled = true;
    };
  }, [place.placeId, placeApi]);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedState() {
      try {
        const savedPlaces = await savedPlaceApi.findMine();
        if (!cancelled) {
          setIsSaved(savedPlaces.some((savedPlace) => savedPlace.placeId === place.placeId));
        }
      } catch (error) {
        logger.error("[MapHomeScreen] failed to load saved places", error);
      }
    }

    void loadSavedState();
    return () => {
      cancelled = true;
    };
  }, [place.placeId, savedPlaceApi]);

  const openReport = useCallback(
    (rowKey?: PlaceDetailRowKey) => {
      const params = new URLSearchParams({
        placeId: String(place.placeId),
        placeName: place.name,
      });
      if (rowKey) {
        params.set("facility", rowKey);
      }
      router.push({ pathname: "/report/place", params: { placeId: String(place.placeId), placeName: place.name, facility: rowKey ?? "" } });
    },
    [place.name, place.placeId, router]
  );

  const toggleSaved = useCallback(async () => {
    if (isSaving) {
      return;
    }

    const nextIsSaved = !isSaved;
    setIsSaving(true);
    setIsSaved(nextIsSaved);

    try {
      if (nextIsSaved) {
        await savedPlaceApi.save(place.placeId);
      } else {
        await savedPlaceApi.unsave(place.placeId);
      }
    } catch (error) {
      logger.error("[MapHomeScreen] failed to toggle saved place", error);
      setIsSaved(!nextIsSaved);
    } finally {
      setIsSaving(false);
    }
  }, [isSaved, isSaving, place.placeId, savedPlaceApi]);

  return (
    <View style={styles.selectedPlace}>
      <View style={styles.selectedPlaceHeader}>
        <View style={styles.selectedPlaceTitleBlock}>
          <Text numberOfLines={2} style={styles.selectedPlaceTitle}>
            {place.name}
          </Text>
          <View style={styles.selectedPlaceMetaRow}>
            <Text style={styles.selectedPlacePin}>{"\u25CF"}</Text>
            <Text style={styles.selectedPlaceReportText}>{TEXT.report} {searchPlaceReportCount(place)}{"\uAC1C"}</Text>
            {selectedBadges.map((badge) => (
              <View key={badge.text} style={[styles.selectedPlaceBadge, badgeStyleFor(badgeTone(badge.tone))]}>
                <Text style={[styles.selectedPlaceBadgeText, badgeTextStyleFor(badgeTone(badge.tone))]}>{badge.text}</Text>
              </View>
            ))}
          </View>
          <Text numberOfLines={1} style={styles.selectedPlaceAddress}>
            {formatDistance(place.distanceMeters)}{" \u00B7 "}{categoryLabel(place.categoryCode)}{" \u00B7 "}{place.address || TEXT.addressMissing}
          </Text>
        </View>
        <View style={styles.selectedPlaceActions}>
          <Pressable
            accessibilityLabel={isSaved ? TEXT.unsavePlace : TEXT.savePlace}
            accessibilityRole="button"
            accessibilityState={{ busy: isSaving, selected: isSaved }}
            disabled={isSaving}
            onPress={() => void toggleSaved()}
            style={[styles.selectedPlaceIconButton, isSaved ? styles.selectedPlaceIconButtonSaved : null]}
          >
            <Image
              resizeMode="contain"
              source={require("../../assets/icons/menu-saved.png")}
              style={[styles.selectedPlaceIconImage, isSaved ? styles.selectedPlaceIconImageSaved : null]}
            />
          </Pressable>
          <Pressable accessibilityLabel={TEXT.closePlace} accessibilityRole="button" onPress={onClose} style={styles.selectedPlaceIconButton}>
            <Text style={styles.selectedPlaceCloseText}>{"\u00D7"}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedPlacePhotos}>
        <Image
          source={place.thumbnailUrl ? { uri: place.thumbnailUrl } : undefined}
          style={[styles.selectedPlacePhoto, !place.thumbnailUrl ? styles.selectedPlacePhotoEmpty : null]}
        />
        <Image
          source={place.thumbnailUrl ? { uri: place.thumbnailUrl } : undefined}
          style={[styles.selectedPlacePhotoNarrow, !place.thumbnailUrl ? styles.selectedPlacePhotoEmpty : null]}
        />
      </ScrollView>

      {showDetails && hasDetailForSelectedPlace ? (
        <PlaceDetailTab
          detail={detail}
          errorMessage={detailError}
          onReport={openReport}
          onRetry={() => void loadDetail({ reveal: true })}
          state={detailLoadState}
        />
      ) : (
        <View style={styles.selectedPlaceButtonRow}>
          <Pressable accessibilityRole="button" onPress={() => {}} style={styles.selectedPlaceRouteButton}>
            <Text style={styles.selectedPlaceRouteButtonText}>{TEXT.route}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void loadDetail({ reveal: true })} style={styles.selectedPlaceDetailButton}>
            <Text style={styles.selectedPlaceDetailButtonText}>{TEXT.detail}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

type DetailTone = "good" | "warning" | "neutral";
type BadgeTone = "good" | "warning" | "info" | "orange" | "neutral";


function StatusPill({ text, tone }: { readonly text: string; readonly tone: DetailTone }) {
  return (
    <View
      style={[
        styles.statusPill,
        tone === "good" ? styles.statusPillGood : tone === "warning" ? styles.statusPillWarning : styles.statusPillNeutral
      ]}
    >
      <Text
        style={[
          styles.statusPillText,
          tone === "good"
            ? styles.statusPillTextGood
            : tone === "warning"
              ? styles.statusPillTextWarning
              : styles.statusPillTextNeutral
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function PlaceDetailTab({
  detail,
  errorMessage,
  onReport,
  onRetry,
  state
}: {
  readonly detail: PlaceDetail | null;
  readonly errorMessage: string | null;
  readonly onReport: (rowKey?: PlaceDetailRowKey) => void;
  readonly onRetry: () => void;
  readonly state: "idle" | "loading" | "success" | "error";
}) {
  if (state === "loading" || state === "idle") {
    return (
      <View style={styles.placeDetailTab}>
        <ActivityIndicator color={colors.brand.mainAlt} />
        <Text style={styles.placeDetailSummaryBody}>{"\uC0C1\uC138 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC774\uC5D0\uC694."}</Text>
      </View>
    );
  }

  if (state === "error" || !detail) {
    return (
      <View style={styles.placeDetailTab}>
        <View style={styles.placeDetailInfoBox}>
          <Text style={styles.placeDetailInfoTitle}>{"\uC0C1\uC138 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC5B4\uC694"}</Text>
          <Text style={styles.placeDetailInfoBody}>{errorMessage ?? "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.selectedPlaceDetailButton}>
          <Text style={styles.selectedPlaceDetailButtonText}>{"\uB2E4\uC2DC \uC2DC\uB3C4"}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.placeDetailTab}>
      <View>
        <Text style={styles.placeDetailSummaryTitle}>{detail.summary.title}</Text>
        <Text style={styles.placeDetailSummaryBody}>{detail.summary.description}</Text>
      </View>

      {detail.issues.length > 0 ? (
        <View style={styles.placeIssueSection}>
          <Text style={styles.placeIssueTitle}>{"\uD655\uC778\uB41C \uC774\uC288 "}{detail.issues.length}{"\uAC74"}</Text>
          {detail.issues.map((issue, index) => (
            <View key={issue.id ?? index} style={styles.placeIssueCard}>
              <Text style={styles.placeIssueName}>! {issue.title}</Text>
              <Text style={styles.placeIssueMeta}>
                {issue.reportedAtLabel ?? issue.createdAt ?? "\uCD5C\uADFC \uC81C\uBCF4"}{" \u00B7 "}{String(issue.confirmCount)}{"\uBA85 \uD655\uC778"}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {detail.detailState === "OFFICIAL_MISSING" || detail.detailState === "REPORT_MISSING" ? (
        <View style={styles.placeDetailInfoBox}>
          <Text style={styles.placeDetailInfoTitle}>
            ! {detail.detailState === "OFFICIAL_MISSING" ? "\uACF5\uC2DD \uC815\uBCF4\uAC00 \uC5C6\uB294 \uC7A5\uC18C\uC608\uC694" : "\uC544\uC9C1 \uC81C\uBCF4\uAC00 \uC5C6\uB294 \uC7A5\uC18C\uC608\uC694"}
          </Text>
          <Text style={styles.placeDetailInfoBody}>{detail.summary.description}</Text>
        </View>
      ) : null}

      <Text style={styles.placeDetailSectionTitle}>{"\uC811\uADFC\uC131 \uC815\uBCF4"}</Text>
      <View style={styles.placeDetailTable}>
        <View style={styles.placeDetailTableHeader}>
          <Text style={styles.placeDetailHeaderBlank} />
          <Text style={styles.placeDetailHeaderText}>{"\uACF5\uC2DD\uC815\uBCF4"}</Text>
          <Text style={styles.placeDetailHeaderText}>{"\uCD5C\uADFC\uC815\uBCF4"}</Text>
        </View>
        {detail.accessibilityRows.map((row, index) => (
          <View
            key={row.key}
            style={[styles.placeDetailRow, index === detail.accessibilityRows.length - 1 ? styles.placeDetailRowLast : null]}
          >
            <Text style={styles.placeDetailRowLabel}>{row.label}</Text>
            <PlaceDetailCell value={row.official} />
            <PlaceDetailCell onReport={() => onReport(row.key)} value={row.recent} />
          </View>
        ))}
      </View>

      <View style={styles.placeDetailNotice}>
        <Text style={styles.placeDetailNoticeText}>! {detail.notice}</Text>
      </View>
    </View>
  );
}

function PlaceDetailCell({
  onReport,
  value
}: {
  readonly onReport?: () => void;
  readonly value: PlaceDetailRowValue;
}) {
  const ctaEnabled = value.reportCtaEnabled || value.status === "NO_REPORT";

  return (
    <View style={styles.placeDetailCell}>
      <StatusPill tone={toneForRowStatus(value.status)} text={value.text} />
      {ctaEnabled && onReport ? (
        <Pressable accessibilityRole="button" onPress={onReport}>
          <Text style={[styles.placeDetailCellSub, styles.placeDetailCellCta]}>
            {value.description || "\uC81C\uBCF4\uD558\uAE30 >"}
          </Text>
        </Pressable>
      ) : (
        <Text style={styles.placeDetailCellSub}>{value.description}</Text>
      )}
    </View>
  );
}

function toneForRowStatus(status: PlaceDetailRowStatus): DetailTone {
  if (status === "AVAILABLE") {
    return "good";
  }
  if (status === "WARNING" || status === "UNAVAILABLE" || status === "BROKEN") {
    return "warning";
  }
  return "neutral";
}

function badgeTone(tone: string): BadgeTone {
  return tone === "good" || tone === "warning" || tone === "info" || tone === "orange" || tone === "neutral"
    ? tone
    : "neutral";
}

function badgeStyleFor(tone: BadgeTone) {
  if (tone === "good") {
    return styles.selectedPlaceBadgeGreen;
  }
  if (tone === "warning") {
    return styles.selectedPlaceBadgeRed;
  }
  if (tone === "orange") {
    return styles.selectedPlaceBadgeOrange;
  }
  if (tone === "neutral") {
    return styles.selectedPlaceBadgeNeutral;
  }
  return styles.selectedPlaceBadgeBlue;
}

function badgeTextStyleFor(tone: BadgeTone) {
  if (tone === "good") {
    return styles.selectedPlaceBadgeTextGreen;
  }
  if (tone === "warning") {
    return styles.selectedPlaceBadgeTextRed;
  }
  if (tone === "orange") {
    return styles.selectedPlaceBadgeTextOrange;
  }
  if (tone === "neutral") {
    return styles.selectedPlaceBadgeTextNeutral;
  }
  return styles.selectedPlaceBadgeTextBlue;
}

function categoryLabel(categoryCode: string | null | undefined): string {
  if (!categoryCode) {
    return TEXT.categoryFallback;
  }
  if (categoryCode.startsWith("A01")) {
    return TEXT.place;
  }
  if (categoryCode.startsWith("A02")) {
    return "\uBB38\uD654\uC2DC\uC124";
  }
  if (categoryCode.startsWith("A03")) {
    return "\uB808\uD3EC\uCE20";
  }
  if (categoryCode.startsWith("A04")) {
    return "\uC1FC\uD551";
  }
  if (categoryCode.startsWith("A05")) {
    return "\uC74C\uC2DD\uC810";
  }
  return TEXT.categoryFallback;
}

function searchPlaceHasWarning(place: PlaceSearchItem): boolean {
  const details = place.bfDetails;
  if (!details) {
    return false;
  }
  return !details.hasRamp || !details.hasElevator || !details.hasAccessibleToilet;
}

function searchPlaceReportCount(place: PlaceSearchItem): number {
  return searchPlaceHasWarning(place) ? 10 : 5;
}

function SearchResultsContent({ errorMessage, onPlacePress, places, selectedPlaceId, state }: SearchResultsContentProps) {
  const placeApi = usePlaceApi();
  const [detailsByPlaceId, setDetailsByPlaceId] = useState<Record<number, PlaceDetail | undefined>>({});

  useEffect(() => {
    if (state !== "success" || places.length === 0) {
      return;
    }
    const missingPlaces = places.filter((place) => detailsByPlaceId[place.placeId] === undefined);
    if (missingPlaces.length === 0) {
      return;
    }

    let cancelled = false;
    async function loadSearchResultDetails() {
      const results = await Promise.allSettled(
        missingPlaces.map(async (place) => ({
          detail: await placeApi.getPlaceDetail(place.placeId),
          placeId: place.placeId
        }))
      );
      if (cancelled) {
        return;
      }
      setDetailsByPlaceId((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const result of results) {
          if (result.status === "fulfilled") {
            next[result.value.placeId] = result.value.detail;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }

    void loadSearchResultDetails();
    return () => {
      cancelled = true;
    };
  }, [detailsByPlaceId, placeApi, places, state]);

  if (state === "loading") {
    return (
      <View style={styles.searchStateView}>
        <ActivityIndicator color={colors.brand.mainAlt} />
        <Text style={styles.searchStateText}>{TEXT.loadingSearch}</Text>
      </View>
    );
  }

  if (state === "error") {
    return (
      <View style={styles.searchStateView}>
        <Text style={styles.searchStateText}>{errorMessage ?? TEXT.searchRetryMessage}</Text>
      </View>
    );
  }

  if (places.length === 0) {
    return (
      <View style={styles.searchStateView}>
        <Text style={styles.searchStateText}>{TEXT.noSearchResults}</Text>
      </View>
    );
  }

  return (
    <View style={styles.searchResultList}>
      {places.map((place, index) => {
        const selected = selectedPlaceId === place.placeId;
        const detail = detailsByPlaceId[place.placeId];
        return (
          <Pressable
            accessibilityLabel={String(index + 1) + " " + place.name}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={place.placeId}
            onPress={() => onPlacePress(place)}
            style={[styles.searchResultCard, selected ? styles.searchResultCardSelected : null]}
          >
            <Text style={styles.searchResultIndex}>{index + 1}</Text>
            {place.thumbnailUrl ? (
              <Image source={{ uri: place.thumbnailUrl }} style={styles.searchResultImage} />
            ) : (
              <View style={[styles.searchResultImage, styles.searchResultImageEmpty]} />
            )}
            <View style={styles.searchResultBody}>
              <Text numberOfLines={1} style={styles.searchResultName}>
                {place.name}
              </Text>
              {detail && detail.badges.length > 0 ? (
                <View style={styles.searchResultBadgeRow}>
                  {detail.badges.map((badge) => (
                    <View key={badge.text} style={[styles.searchResultBadge, badgeStyleFor(badgeTone(badge.tone))]}>
                      <Text style={[styles.searchResultBadgeText, badgeTextStyleFor(badgeTone(badge.tone))]}>
                        {badge.text}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              <Text numberOfLines={1} style={styles.searchResultMeta}>
                {formatDistance(place.distanceMeters)}{" \u00B7 "}{categoryLabel(place.categoryCode)}
              </Text>
            </View>
            <Text style={styles.searchResultChevron}>{"\u203A"}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function formatDistance(distanceMeters: number): string {
  if (distanceMeters >= 1000) {
    return (distanceMeters / 1000).toFixed(1) + "km";
  }
  return Math.round(distanceMeters).toString() + "m";
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
    top: 112
  },
  filterRowContent: {
    flexDirection: "row",
    gap: spacing[2]
  },
  map: {
    flex: 1
  },
  placeMarkerLabelContainer: {
    alignItems: "center",
    width: 132
  },
  placeMarkerLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 18,
    maxWidth: 124,
    textAlign: "center",
    textShadowColor: colors.background.primary,
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2
  },
  placeMarkerShape: {
    alignItems: "center",
    height: 56,
    justifyContent: "center",
    position: "relative",
    width: 45
  },
  placeMarkerText: {
    position: "absolute",
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 24,
    top: 13
  },
  searchBackButton: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    width: 32
  },
  searchBackText: {
    color: colors.icon.primary,
    fontSize: 40,
    lineHeight: 40
  },
  searchBox: {
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: radius.full,
    borderWidth: 1,
    elevation: 5,
    flex: 1,
    flexDirection: "row",
    minHeight: 56,
    paddingLeft: spacing[3],
    paddingRight: spacing[2],
    shadowColor: "#000000",
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 8
  },
  searchClearButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  searchClearText: {
    color: colors.icon.disabled,
    fontSize: 36,
    lineHeight: 36
  },
  searchHereButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: radius.full,
    borderWidth: 1,
    elevation: 3,
    flexDirection: "row",
    gap: spacing[1],
    marginTop: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    shadowColor: "#000000",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 5
  },
  searchHereIcon: {
    color: colors.brand.mainAlt,
    fontSize: 22,
    lineHeight: 24
  },
  searchHereText: {
    color: colors.brand.mainAlt,
    fontSize: 18,
    fontWeight: "600"
  },
  searchInput: {
    color: colors.text.primary,
    flex: 1,
    fontSize: 20,
    fontWeight: "500",
    minWidth: 0,
    paddingVertical: 0
  },
  searchLogoMark: {
    height: 28,
    tintColor: colors.brand.main,
    width: 28
  },
  searchOverlay: {
    left: spacing[4],
    position: "absolute",
    right: spacing[4],
    top: spacing[6]
  },
  searchResultBody: {
    flex: 1,
    gap: spacing[1],
    minWidth: 0
  },
  searchResultCard: {
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    minHeight: 104,
    padding: spacing[4]
  },
  searchResultCardSelected: {
    borderColor: colors.brand.mainAlt,
    borderWidth: 2
  },
  searchResultBadge: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing[2],
    paddingVertical: 2
  },
  searchResultBadgeRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1]
  },
  searchResultBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18
  },
  searchResultChevron: {
    color: colors.icon.primary,
    fontSize: 32,
    fontWeight: "600",
    lineHeight: 34
  },
  searchResultImage: {
    backgroundColor: colors.neutral[200],
    borderRadius: radius.md,
    height: 72,
    width: 72
  },
  searchResultImageEmpty: {
    borderColor: colors.border.regular,
    borderWidth: 1
  },
  searchResultIndex: {
    color: colors.text.secondary,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    width: 28
  },
  searchResultList: {
    gap: spacing[3]
  },
  searchResultMeta: {
    color: colors.text.tertiary,
    fontSize: 15
  },
  searchResultName: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  },
  searchStateText: {
    color: colors.text.secondary,
    fontSize: 15,
    textAlign: "center"
  },
  searchStateView: {
    alignItems: "center",
    gap: spacing[3],
    justifyContent: "center",
    paddingVertical: spacing[8]
  },
  searchSubmitButton: {
    alignItems: "center",
    backgroundColor: colors.brand.mainAlt,
    borderRadius: radius.lg,
    gap: 2,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  searchSubmitText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: "700"
  },
  selectedPlace: {
    gap: spacing[5]
  },
  selectedPlaceActions: {
    flexDirection: "row",
    gap: spacing[3],
    paddingTop: spacing[1]
  },
  selectedPlaceAddress: {
    color: colors.text.disabled,
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 24
  },
  selectedPlaceBadge: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing[2],
    paddingVertical: 3
  },
  selectedPlaceBadgeBlue: {
    backgroundColor: colors.background.primary,
    borderColor: colors.brand.mainAlt
  },
  selectedPlaceBadgeGreen: {
    backgroundColor: colors.semantic.success.light,
    borderColor: colors.semantic.success.dark
  },
  selectedPlaceBadgeNeutral: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.strong
  },
  selectedPlaceBadgeOrange: {
    backgroundColor: "#FFF7E6",
    borderColor: "#F5A623"
  },
  selectedPlaceBadgeRed: {
    backgroundColor: colors.background.primary,
    borderColor: colors.semantic.danger.DEFAULT
  },
  selectedPlaceBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18
  },
  selectedPlaceBadgeTextBlue: {
    color: colors.brand.mainAlt
  },
  selectedPlaceBadgeTextGreen: {
    color: colors.semantic.success.dark
  },
  selectedPlaceBadgeTextNeutral: {
    color: colors.text.tertiary
  },
  selectedPlaceBadgeTextOrange: {
    color: "#F5A623"
  },
  selectedPlaceBadgeTextRed: {
    color: colors.semantic.danger.DEFAULT
  },
  selectedPlaceButtonRow: {
    borderTopColor: colors.border.light,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing[3],
    marginHorizontal: -spacing[5],
    paddingBottom: spacing[1],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6]
  },
  selectedPlaceCloseText: {
    color: colors.icon.secondary,
    fontSize: 28,
    lineHeight: 30
  },
  selectedPlaceDetailButton: {
    alignItems: "center",
    backgroundColor: colors.brand.mainAlt,
    borderRadius: radius.xl,
    flex: 1,
    height: 64,
    justifyContent: "center"
  },
  selectedPlaceDetailButtonText: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: "600"
  },
  selectedPlaceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between"
  },
  selectedPlaceIconButton: {
    alignItems: "center",
    backgroundColor: colors.background.regular,
    borderRadius: radius.full,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  selectedPlaceIconButtonSaved: {
    backgroundColor: "#ECEBFF"
  },
  selectedPlaceIconText: {
    color: colors.icon.secondary,
    fontSize: 28,
    lineHeight: 30
  },
  selectedPlaceIconImage: {
    height: 24,
    tintColor: colors.icon.secondary,
    width: 24
  },
  selectedPlaceIconImageSaved: {
    tintColor: colors.brand.mainAlt
  },
  selectedPlaceMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[1]
  },
  selectedPlacePhoto: {
    backgroundColor: colors.neutral[200],
    height: 156,
    marginRight: spacing[3],
    width: 286
  },
  selectedPlacePhotoEmpty: {
    borderColor: colors.border.regular,
    borderWidth: 1
  },
  selectedPlacePhotoNarrow: {
    backgroundColor: colors.neutral[200],
    height: 156,
    width: 150
  },
  selectedPlacePhotos: {
    marginRight: -spacing[5]
  },
  selectedPlacePin: {
    color: colors.icon.primary,
    fontSize: 18,
    lineHeight: 22
  },
  selectedPlaceReportText: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
    marginRight: spacing[1]
  },
  selectedPlaceRouteButton: {
    alignItems: "center",
    backgroundColor: "#ECEBFF",
    borderRadius: radius.xl,
    flex: 1,
    height: 64,
    justifyContent: "center"
  },
  selectedPlaceRouteButtonText: {
    color: colors.brand.mainAlt,
    fontSize: 20,
    fontWeight: "800"
  },
  selectedPlaceTitle: {
    color: colors.text.primary,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 38
  },
  selectedPlaceTitleBlock: {
    flex: 1,
    gap: spacing[2],
    minWidth: 0
  },
  placeDetailCell: {
    alignItems: "center",
    flex: 1,
    gap: spacing[1]
  },
  placeDetailCellSub: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center"
  },
  placeDetailCellCta: {
    color: colors.brand.mainAlt
  },
  placeDetailHeaderBlank: {
    flex: 1
  },
  placeDetailHeaderText: {
    color: colors.text.tertiary,
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center"
  },
  placeDetailInfoBody: {
    color: colors.text.disabled,
    fontSize: 14,
    lineHeight: 22,
    marginLeft: spacing[5],
    marginTop: spacing[3]
  },
  placeDetailInfoBox: {
    backgroundColor: colors.background.light,
    borderColor: colors.border.regular,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4]
  },
  placeDetailInfoTitle: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22
  },
  placeDetailNotice: {
    backgroundColor: colors.background.regular,
    borderColor: colors.border.regular,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3]
  },
  placeDetailNoticeText: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 16
  },
  placeDetailRow: {
    alignItems: "center",
    borderBottomColor: colors.border.regular,
    borderBottomWidth: 1,
    flexDirection: "row",
    minHeight: 76,
    paddingVertical: spacing[3]
  },
  placeDetailRowLabel: {
    color: colors.text.tertiary,
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  placeDetailRowLast: {
    borderBottomWidth: 0
  },
  placeDetailSummaryBody: {
    color: colors.text.disabled,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing[1]
  },
  placeDetailSummaryTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28
  },
  placeDetailTab: {
    gap: spacing[4]
  },
  placeDetailSectionTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28
  },
  placeDetailTable: {
    borderColor: colors.border.regular,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4]
  },
  placeDetailTableHeader: {
    flexDirection: "row",
    paddingBottom: spacing[2]
  },
  placeIssueActions: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[4]
  },
  placeIssueButton: {
    alignItems: "center",
    borderColor: colors.border.regular,
    borderRadius: radius.full,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing[3]
  },
  placeIssueButtonPrimary: {
    borderColor: colors.brand.mainAlt
  },
  placeIssueButtonPrimaryText: {
    color: colors.brand.mainAlt,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18
  },
  placeIssueButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18
  },
  placeIssueCard: {
    borderColor: colors.border.regular,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing[4]
  },
  placeIssueMeta: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing[2]
  },
  placeIssueName: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24
  },
  placeIssueSection: {
    gap: spacing[3]
  },
  placeIssueTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 28
  },
  statusPill: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing[2],
    paddingVertical: 3
  },
  statusPillGood: {
    backgroundColor: colors.semantic.success.light,
    borderColor: colors.semantic.success.dark
  },
  statusPillNeutral: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.strong
  },
  statusPillWarning: {
    backgroundColor: colors.background.primary,
    borderColor: colors.semantic.danger.DEFAULT
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16
  },
  statusPillTextGood: {
    color: colors.semantic.success.dark
  },
  statusPillTextNeutral: {
    color: colors.text.tertiary
  },
  statusPillTextWarning: {
    color: colors.semantic.danger.DEFAULT
  }
});
