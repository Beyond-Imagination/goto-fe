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
  | "LONG_WALKING_DISTANCE"
  | "OBSTRUCTION"
  | "ILLEGAL_PARKING"
  | "BRAILLE_BLOCK_DAMAGE"
  | "SLIPPERY_SURFACE"
  | "OTHER";

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

export type ObstacleReportStatus = "ACTIVE" | "RESOLVED";

export type CreateObstacleReportRequest = Readonly<{
  lat: number;
  lng: number;
  issueType: ObstacleIssueType;
  severity: ObstacleSeverity;
  /** BE에서 @NotEmpty — 최소 한 개는 보내야 합니다. */
  affectedMobilityTypes: readonly MobilityType[];
  /** 업로드 API로 먼저 올린 뒤 받은 URL만 넣습니다. */
  photoUrls?: readonly string[];
  /** 메모 (선택). 서버에서 앞뒤 공백을 다듬고, 빈 문자열은 null로 저장합니다. */
  description?: string;
}>;

export type ObstacleReportResponse = Readonly<{
  id: number;
  lat: number;
  lng: number;
  issueType: ObstacleIssueType;
  severity: ObstacleSeverity;
  affectedMobilityTypes: readonly MobilityType[];
  photoUrls: readonly string[];
  /** 제보자가 남긴 메모. 없으면 null입니다. */
  description: string | null;
  status: ObstacleReportStatus;
  stale: boolean;
  confirmedCount: number;
  createdAt: string;
  lastConfirmedAt: string | null;
}>;

/** 「아직 있어요」 / 「해결됐어요」 */
export type ObstacleReportStatusAction = "STILL_PRESENT" | "RESOLVED";

/** 업로드할 사진 한 장. expo-image-picker 결과에서 만듭니다. */
export type UploadImageInput = Readonly<{
  uri: string;
  /** image/jpeg 등. BE가 Content-Type으로 검증합니다. */
  mimeType: string;
  fileName?: string;
}>;

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
  create(request: CreateObstacleReportRequest): Promise<ObstacleReportResponse>;
  get(id: number): Promise<ObstacleReportResponse>;
  updateStatus(id: number, action: ObstacleReportStatusAction): Promise<ObstacleReportResponse>;
  uploadImage(image: UploadImageInput): Promise<string>;
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

    async create(request) {
      return client.post<ObstacleReportResponse, CreateObstacleReportRequest>(
        "/api/v1/obstacle-reports",
        request
      );
    },

    async get(id) {
      return client.get<ObstacleReportResponse>(`/api/v1/obstacle-reports/${String(id)}`);
    },

    async updateStatus(id, action) {
      return client.post<ObstacleReportResponse, { action: ObstacleReportStatusAction }>(
        `/api/v1/obstacle-reports/${String(id)}/status`,
        { action }
      );
    },

    async uploadImage(image) {
      // multipart는 HttpClient의 JSON 직렬화를 우회해야 하므로 FormData를 직접 넘깁니다.
      // React Native의 FormData는 { uri, type, name } 형태를 파일로 인식합니다.
      const form = new FormData();
      form.append("file", {
        uri: image.uri,
        type: image.mimeType,
        name: image.fileName ?? "photo.jpg",
      } as unknown as Blob);

      const response = await client.post<{ url: string }, FormData>(
        "/api/v1/uploads/images",
        form
      );
      return response.url;
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
