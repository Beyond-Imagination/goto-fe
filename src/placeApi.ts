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
  hasIndoorMap: boolean;
};

export type PlaceSearchResult = {
  places: PlaceSearchItem[];
};

export type SearchPlacesOptions = {
  k?: number;
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
