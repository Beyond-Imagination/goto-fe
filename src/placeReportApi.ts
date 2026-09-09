import { createHttpClient, getApiBaseUrl, type TokenProvider } from './api';
import type {
  PlaceAccessStatus,
  PlaceFacilityStatus,
  PriorityFacility,
} from './myinfo/myInfoApi';

export type { PlaceAccessStatus, PlaceFacilityStatus, PriorityFacility, TokenProvider };

export type PlaceFacilityStatusMap = Readonly<Partial<Record<PriorityFacility, PlaceFacilityStatus>>>;

export type CreatePlaceStateReportRequest = Readonly<{
  placeId: number;
  accessStatus: PlaceAccessStatus;
  /** 확인하지 못한 항목은 키를 보내지 않습니다 (「없음」과 「확인 못 함」은 다릅니다). */
  facilityStatuses?: PlaceFacilityStatusMap;
  /** 업로드 API로 먼저 올린 뒤 받은 URL만 넣습니다. */
  photoUrls?: readonly string[];
  description?: string;
}>;

export type PlaceStateReportResponse = Readonly<{
  id: number;
  placeId: number;
  placeName: string;
  /** 장소의 정제 주소. 없으면 null입니다. */
  placeAddress: string | null;
  /** 장소에 좌표가 없으면 null입니다. */
  latitude: number | null;
  longitude: number | null;
  accessStatus: PlaceAccessStatus;
  facilityStatuses: PlaceFacilityStatusMap;
  photoUrls: readonly string[];
  description: string | null;
  createdAt: string;
}>;

export type PlaceReportApiOptions = Readonly<{
  baseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImplementation?: typeof fetch;
}>;

export type PlaceReportApi = Readonly<{
  create(request: CreatePlaceStateReportRequest): Promise<PlaceStateReportResponse>;
  get(id: number): Promise<PlaceStateReportResponse>;
  findByPlace(placeId: number): Promise<readonly PlaceStateReportResponse[]>;
}>;

/** 장소 단위 상태 제보 API (BE: I. Place State Report). */
export function createPlaceReportApi(options?: PlaceReportApiOptions): PlaceReportApi {
  const client = createHttpClient({
    baseUrl: options?.baseUrl ?? getApiBaseUrl(),
    getAccessToken: options?.getAccessToken,
    fetch: options?.fetchImplementation,
  });

  return {
    async create(request) {
      return client.post<PlaceStateReportResponse, CreatePlaceStateReportRequest>(
        '/api/v1/place-state-reports',
        request,
      );
    },

    async get(id) {
      return client.get<PlaceStateReportResponse>(`/api/v1/place-state-reports/${String(id)}`);
    },

    async findByPlace(placeId) {
      return client.get<readonly PlaceStateReportResponse[]>(
        `/api/v1/places/${String(placeId)}/state-reports`,
      );
    },
  };
}
