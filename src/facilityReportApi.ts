import { createHttpClient, getApiBaseUrl, type TokenProvider } from './api';

export type { TokenProvider };

/** BE FacilityIssueType와 1:1. */
export type FacilityIssueType =
  | 'BROKEN'
  | 'OUT_OF_SERVICE'
  | 'BLOCKED'
  | 'DAMAGED'
  | 'MISSING'
  | 'REPAIRED'
  | 'OTHER';

export type CreateFacilityReportRequest = Readonly<{
  nodeId: number;
  issueType: FacilityIssueType;
  description?: string;
}>;

/** 체크포인트 노드를 제보하면 서버가 현재 위치 보정 정보를 함께 돌려줍니다. */
export type FacilityReportCalibration = Readonly<{
  confirmedAt: string;
  latitude: number;
  longitude: number;
  floorLevel: number | null;
  snapRadius: number | null;
}>;

export type FacilityReportResponse = Readonly<{
  id: number;
  nodeId: number;
  nodeType: string;
  nodeName: string | null;
  floorLevel: number | null;
  placeId: number;
  placeName: string;
  latitude: number;
  longitude: number;
  issueType: string;
  description: string | null;
  createdAt: string;
  calibration: FacilityReportCalibration | null;
}>;

export type FacilityReportApiOptions = Readonly<{
  baseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImplementation?: typeof fetch;
}>;

export type FacilityReportApi = Readonly<{
  create(request: CreateFacilityReportRequest): Promise<FacilityReportResponse>;
  get(id: number): Promise<FacilityReportResponse>;
}>;

/** 실내 시설 상태 제보 API (BE: E. Report). */
export function createFacilityReportApi(options?: FacilityReportApiOptions): FacilityReportApi {
  const client = createHttpClient({
    baseUrl: options?.baseUrl ?? getApiBaseUrl(),
    getAccessToken: options?.getAccessToken,
    fetch: options?.fetchImplementation,
  });

  return {
    async create(request) {
      return client.post<FacilityReportResponse, CreateFacilityReportRequest>(
        '/api/v1/reports',
        request,
      );
    },

    async get(id) {
      return client.get<FacilityReportResponse>(`/api/v1/reports/${String(id)}`);
    },
  };
}
