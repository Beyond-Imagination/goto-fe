import { createHttpClient, getApiBaseUrl, type TokenProvider } from "./api";

export type { TokenProvider };

export type MobilityType = "WHEELCHAIR" | "STROLLER" | "SLOW_WALKER";

export type ObstacleIssueType =
  | "STAIRS"
  | "HIGH_CURB"
  | "STEEP_SLOPE"
  | "NARROW_PASSAGE"
  | "CONSTRUCTION"
  | "SIDEWALK_DAMAGE"
  | "LONG_WALKING_DISTANCE";

// IMPASSABLE=우회권장, CAUTION=주의, INFO=안전. "안전"은 새 값이 아니라 INFO를 부르는 이름이다 (CONTEXT.md 참고).
export type ObstacleSeverity = "IMPASSABLE" | "CAUTION" | "INFO";

export type ObstacleReportClusterIssueTypeCount = {
  issueType: ObstacleIssueType;
  count: number;
};

export type ObstacleReportCluster = {
  centerLat: number;
  centerLng: number;
  reportCount: number;
  maxSeverity: ObstacleSeverity;
  topIssueTypes: ObstacleReportClusterIssueTypeCount[];
  latestReportAt: string;
  affectedMobilityTypes: MobilityType[];
  confirmedReportCount: number;
  resolvedReportCount: number;
  staleReportCount: number;
  // reportCount === 1(가까운 줌)일 때만 채워진다. 클러스터일 땐 둘 다 null.
  id: number | null;
  photoUrls: string[] | null;
  // 중간 줌 구간에서만 채워진다. 매칭되는 장소/행정동이 없으면 null.
  nearbyPlaceLabel: string | null;
};

export type ObstacleReportClusterBbox = {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
};

export type ObstacleReportClusterFilters = {
  mobilityTypes?: readonly MobilityType[];
  avoid?: readonly ObstacleIssueType[];
};

export type ObstacleReportApiOptions = Readonly<{
  baseUrl?: string;
  apiBaseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImplementation?: typeof fetch;
}>;

export type ObstacleReportApi = Readonly<{
  getClusters(
    bbox: ObstacleReportClusterBbox,
    zoom: number,
    filters?: ObstacleReportClusterFilters,
  ): Promise<ObstacleReportCluster[]>;
}>;

export function createObstacleReportApi(options?: ObstacleReportApiOptions): ObstacleReportApi {
  const client = createHttpClient({
    baseUrl: options?.baseUrl ?? options?.apiBaseUrl ?? getApiBaseUrl(),
    getAccessToken: options?.getAccessToken,
    fetch: options?.fetchImplementation,
  });

  return {
    async getClusters(bbox, zoom, filters = {}) {
      const params = new URLSearchParams({
        minLat: String(bbox.minLat),
        minLng: String(bbox.minLng),
        maxLat: String(bbox.maxLat),
        maxLng: String(bbox.maxLng),
        zoom: String(zoom),
      });

      for (const mobilityType of filters.mobilityTypes ?? []) {
        params.append("mobilityTypes", mobilityType);
      }
      for (const issueType of filters.avoid ?? []) {
        params.append("avoid", issueType);
      }

      return client.get<ObstacleReportCluster[]>(
        `/api/v1/obstacle-reports/clusters?${params.toString()}`
      );
    },
  };
}

// 하위 호환성을 위한 standalone 래퍼 함수
export async function fetchObstacleClusters(
  accessToken: string,
  bbox: ObstacleReportClusterBbox,
  zoom: number,
  filters: ObstacleReportClusterFilters = {},
  clientOptions?: { baseUrl?: string; apiBaseUrl?: string; fetchImplementation?: typeof fetch }
): Promise<ObstacleReportCluster[]> {
  const api = createObstacleReportApi({
    baseUrl: clientOptions?.baseUrl ?? clientOptions?.apiBaseUrl,
    getAccessToken: () => accessToken,
    fetchImplementation: clientOptions?.fetchImplementation,
  });
  return api.getClusters(bbox, zoom, filters);
}
