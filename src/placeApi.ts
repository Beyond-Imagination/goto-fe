import { createHttpClient, getApiBaseUrl, type TokenProvider } from "./api";
import { MobilityType, ObstacleIssueType } from "./obstacleReportApi";

export type { TokenProvider };

export type NearbyAccessibilitySummary = {
  detourRecommendedCount: number;
  cautionCount: number;
  safeCount: number;
  needsConfirmationCount: number;
};

export type NearbyAccessibilitySummaryOptions = {
  mobilityTypes?: readonly MobilityType[];
  avoid?: readonly ObstacleIssueType[];
};

export type PlaceSearchItem = {
  placeId: number;
  name: string;
  categoryCode: string;
  address: string;
  thumbnailUrl: string | null;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  bfDetails?: {
    hasElevator: boolean;
    hasAccessibleToilet: boolean;
    hasRamp: boolean;
  } | null;
  hasIndoorMap: boolean;
};

export type PlaceSearchResult = {
  places: PlaceSearchItem[];
};

export type PlaceDetailState = "NORMAL" | "WARNING" | "OFFICIAL_MISSING" | "REPORT_MISSING";
export type PlaceDetailRowKey = "ENTRANCE" | "ELEVATOR" | "ACCESSIBLE_TOILET" | "PARKING" | "NURSING_ROOM";
export type PlaceDetailRowStatus = "AVAILABLE" | "WARNING" | "UNAVAILABLE" | "BROKEN" | "NO_OFFICIAL" | "NO_REPORT";

export type PlaceDetailRowValue = {
  status: PlaceDetailRowStatus;
  text: string;
  description: string;
  reportCtaEnabled: boolean;
};

export type PlaceDetail = {
  placeId: number;
  name: string;
  address: string | null;
  category: string | null;
  categoryCode: string | null;
  thumbnailUrls: string[];
  detailState: PlaceDetailState;
  badges: { text: string; tone: "good" | "warning" | "info" | "orange" | "neutral" | string }[];
  summary: { title: string; description: string };
  issues: {
    id: number | null;
    title: string;
    reportedAtLabel?: string | null;
    createdAt?: string | null;
    confirmCount: number;
    status: string;
  }[];
  accessibilityRows: {
    key: PlaceDetailRowKey;
    label: string;
    official: PlaceDetailRowValue;
    recent: PlaceDetailRowValue;
  }[];
  notice: string;
};

export type SearchPlacesOptions = {
  k?: number;
  keyword?: string;
  categoryPrefixes?: readonly string[];
  // 현재 백엔드에서 no-op(ADR-0004) — 요청은 보내지만 실제 필터링은 아직 적용 안 됨.
  mobilityTypes?: readonly MobilityType[];
  avoid?: readonly ObstacleIssueType[];
};

export type PlaceApiOptions = Readonly<{
  baseUrl?: string;
  apiBaseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImplementation?: typeof fetch;
}>;

/** 실내 층 도면의 시설 노드. BE FacilityNodeResponse와 1:1. */
export type FacilityNode = {
  id: number;
  floorMapId: number;
  targetFeatureId: string | null;
  nodeType: string;
  name: string | null;
  lat: number | null;
  lng: number | null;
  isCheckpoint: boolean | null;
  snapRadius: number | null;
  locationDescription: string | null;
};

export type PlaceApi = Readonly<{
  getNearbySummary(
    lat: number,
    lng: number,
    options?: NearbyAccessibilitySummaryOptions,
  ): Promise<NearbyAccessibilitySummary>;
  searchPlaces(
    lat: number,
    lng: number,
    options?: SearchPlacesOptions,
  ): Promise<PlaceSearchResult>;
  getPlaceDetail(placeId: number): Promise<PlaceDetail>;
  /** 실내 도면이 있는 층 목록. 지하는 음수입니다. */
  listFloors(placeId: number): Promise<number[]>;
  listFacilityNodes(placeId: number, floor: number): Promise<FacilityNode[]>;
}>;

export function createPlaceApi(options?: PlaceApiOptions): PlaceApi {
  const client = createHttpClient({
    baseUrl: options?.baseUrl ?? options?.apiBaseUrl ?? getApiBaseUrl(),
    getAccessToken: options?.getAccessToken,
    fetch: options?.fetchImplementation,
  });

  return {
    async getNearbySummary(lat, lng, options = {}) {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
      for (const mobilityType of options.mobilityTypes ?? []) {
        params.append("mobilityTypes", mobilityType);
      }
      for (const issueType of options.avoid ?? []) {
        params.append("avoid", issueType);
      }
      return client.get<NearbyAccessibilitySummary>(`/api/v1/places/nearby-summary?${params.toString()}`);
    },

    async listFloors(placeId) {
      return client.get<number[]>(`/api/v1/places/${String(placeId)}/floors`);
    },

    async listFacilityNodes(placeId, floor) {
      return client.get<FacilityNode[]>(
        `/api/v1/places/${String(placeId)}/floors/${String(floor)}/nodes`
      );
    },

    async searchPlaces(lat, lng, options = {}) {
      const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
      if (options.k !== undefined) {
        params.set("k", String(options.k));
      }
      const keyword = options.keyword?.trim();
      if (keyword) {
        params.set("keyword", keyword);
      }
      for (const prefix of options.categoryPrefixes ?? []) {
        params.append("categoryPrefixes", prefix);
      }
      for (const mobilityType of options.mobilityTypes ?? []) {
        params.append("mobilityTypes", mobilityType);
      }
      for (const issueType of options.avoid ?? []) {
        params.append("avoid", issueType);
      }
      return client.get<PlaceSearchResult>(`/api/v1/places/search?${params.toString()}`);
    },

    async getPlaceDetail(placeId) {
      return client.get<PlaceDetail>(`/api/v1/places/${String(placeId)}/detail`);
    },
  };
}

// 하위 호환성을 위한 standalone 래퍼 함수
export async function fetchNearbyAccessibilitySummary(
  accessToken: string,
  lat: number,
  lng: number,
  options: NearbyAccessibilitySummaryOptions = {},
  clientOptions?: { baseUrl?: string; apiBaseUrl?: string; fetchImplementation?: typeof fetch }
): Promise<NearbyAccessibilitySummary> {
  const api = createPlaceApi({
    baseUrl: clientOptions?.baseUrl ?? clientOptions?.apiBaseUrl,
    getAccessToken: () => accessToken,
    fetchImplementation: clientOptions?.fetchImplementation,
  });
  return api.getNearbySummary(lat, lng, options);
}

export async function searchPlaces(
  accessToken: string,
  lat: number,
  lng: number,
  options: SearchPlacesOptions = {},
  clientOptions?: { baseUrl?: string; apiBaseUrl?: string; fetchImplementation?: typeof fetch }
): Promise<PlaceSearchResult> {
  const api = createPlaceApi({
    baseUrl: clientOptions?.baseUrl ?? clientOptions?.apiBaseUrl,
    getAccessToken: () => accessToken,
    fetchImplementation: clientOptions?.fetchImplementation,
  });
  return api.searchPlaces(lat, lng, options);
}

export async function getPlaceDetail(
  accessToken: string,
  placeId: number,
  clientOptions?: { baseUrl?: string; apiBaseUrl?: string; fetchImplementation?: typeof fetch }
): Promise<PlaceDetail> {
  const api = createPlaceApi({
    baseUrl: clientOptions?.baseUrl ?? clientOptions?.apiBaseUrl,
    getAccessToken: () => accessToken,
    fetchImplementation: clientOptions?.fetchImplementation,
  });
  return api.getPlaceDetail(placeId);
}
