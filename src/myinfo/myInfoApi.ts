import { ApiError, createHttpClient, getApiBaseUrl } from '@/api';

/** BE enum과 1:1로 맞춘 값들. 화면 표시 라벨은 myInfoLabels.ts에서 매핑합니다. */
export type MobilityMode = 'WHEELCHAIR' | 'WALK' | 'STROLLER';

export type PriorityFacility = 'ELEVATOR' | 'ACCESSIBLE_TOILET' | 'RAMP' | 'PARKING';

export type AvoidCondition = 'STAIRS' | 'STEEP_SLOPE' | 'UNEVEN_SURFACE';

export type MobilityType = 'WHEELCHAIR' | 'STROLLER' | 'SLOW_WALKER';

export type ObstacleIssueType =
  | 'STAIRS'
  | 'HIGH_CURB'
  | 'STEEP_SLOPE'
  | 'NARROW_PASSAGE'
  | 'CONSTRUCTION'
  | 'SIDEWALK_DAMAGE'
  | 'LONG_WALKING_DISTANCE'
  | 'OBSTRUCTION'
  | 'ILLEGAL_PARKING'
  | 'BRAILLE_BLOCK_DAMAGE'
  | 'SLIPPERY_SURFACE'
  | 'OTHER';

export type ObstacleSeverity = 'IMPASSABLE' | 'CAUTION' | 'INFO';

export type ObstacleReportStatus = 'ACTIVE' | 'RESOLVED';

export type MyActivityStats = Readonly<{
  reportCount: number;
  helpedPeopleCount: number;
  resolvedConfirmationCount: number;
}>;

export type MyProfileResponse = Readonly<{
  nickname: string;
  mobilityModes: readonly MobilityMode[];
  stats: MyActivityStats;
}>;

export type MyPreferencesResponse = Readonly<{
  mobilityModes: readonly MobilityMode[];
  priorityFacilities: readonly PriorityFacility[];
  avoidConditions: readonly AvoidCondition[];
}>;

export type NotificationSettings = Readonly<{
  savedPlaceStatusChange: boolean;
  savedPlaceNearbyObstacle: boolean;
  myReportConfirmed: boolean;
  myReportConfirmationRequested: boolean;
  nearbyHelpRequest: boolean;
  myHelpRequestAccepted: boolean;
}>;

export type DisplaySettings = Readonly<{
  largeText: boolean;
  highContrast: boolean;
  vibration: boolean;
  statusAlerts: boolean;
}>;

export type MySettingsResponse = Readonly<{
  notifications: NotificationSettings;
  display: DisplaySettings;
}>;

export type MyObstacleReportResponse = Readonly<{
  id: number;
  issueType: ObstacleIssueType;
  severity: ObstacleSeverity;
  status: ObstacleReportStatus;
  stale: boolean;
  affectedMobilityTypes: readonly MobilityType[];
  latitude: number;
  longitude: number;
  /**
   * BE가 네이버 리버스 지오코딩으로 채우는 행정동 주소.
   * 키 미설정·호출 실패·매칭 없음이면 null이고, 그때는 toObstacleReportListItem이 좌표 문자열로 대체합니다.
   */
  address: string | null;
  photoUrls: readonly string[];
  /** 제보자가 남긴 메모. 없으면 null입니다. */
  description: string | null;
  confirmedCount: number;
  lastConfirmedAt: string | null;
  createdAt: string;
}>;

/** 장소 전반의 이용 난이도. BE PlaceAccessStatus와 같은 값입니다. */
export type PlaceAccessStatus = 'ACCESSIBLE' | 'PARTIALLY_ACCESSIBLE' | 'INACCESSIBLE';

/** 편의시설 상태. 확인하지 못한 항목은 키 자체가 없습니다. */
export type PlaceFacilityStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'BROKEN';

export type MyPlaceStateReportResponse = Readonly<{
  id: number;
  placeId: number;
  placeName: string;
  /** 장소의 정제 주소. 없으면 null입니다. */
  address: string | null;
  /** 장소에 좌표가 없으면 null입니다. */
  latitude: number | null;
  longitude: number | null;
  accessStatus: PlaceAccessStatus;
  facilityStatuses: Readonly<Partial<Record<PriorityFacility, PlaceFacilityStatus>>>;
  photoUrls: readonly string[];
  description: string | null;
  createdAt: string;
}>;

export type MyFacilityReportResponse = Readonly<{
  id: number;
  nodeId: number;
  nodeType: string;
  nodeName: string | null;
  /** 지하는 음수입니다. 도면에 층 정보가 없으면 null. */
  floorLevel: number | null;
  placeId: number;
  placeName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  /** BE FacilityIssueType. 예전 데이터에는 목록에 없는 값이 있을 수 있어 string으로 받습니다. */
  issueType: string;
  description: string | null;
  createdAt: string;
}>;

/** 내 제보 기록의 분류. BE MyReportKind와 1:1. */
export type MyReportKind = 'OBSTACLE' | 'PLACE' | 'FACILITY';

/**
 * 내 제보 기록 목록 항목.
 * 분류마다 필요한 필드가 달라 kind에 해당하는 본문 하나만 채워집니다.
 */
export type MyReportItemResponse = Readonly<{
  kind: MyReportKind;
  createdAt: string;
  obstacle: MyObstacleReportResponse | null;
  place: MyPlaceStateReportResponse | null;
  facility: MyFacilityReportResponse | null;
}>;

export type MyReportPage = Readonly<{
  items: readonly MyReportItemResponse[];
  /** 다음 페이지 커서. null이면 마지막 페이지입니다. */
  nextCursor: string | null;
}>;

export type MyReportPageQuery = Readonly<{
  kind?: MyReportKind;
  cursor?: string | null;
  size?: number;
}>;

export type MyConfirmedReportResponse = Readonly<{
  confirmationId: number;
  confirmedAt: string;
  report: MyObstacleReportResponse;
}>;

export type MyConfirmedReportPage = Readonly<{
  items: readonly MyConfirmedReportResponse[];
  nextCursor: string | null;
}>;

export type MyConfirmedReportPageQuery = Readonly<{
  /** 확인 대상 제보 상태 필터. 없으면 전체. */
  status?: ObstacleReportStatus;
  cursor?: string | null;
  size?: number;
}>;

export type UpdateMyPreferencesRequest = Readonly<{
  mobilityModes: readonly MobilityMode[];
  priorityFacilities: readonly PriorityFacility[];
  avoidConditions: readonly AvoidCondition[];
}>;

export type UpdateMySettingsRequest = Readonly<{
  notifications: NotificationSettings;
  display: DisplaySettings;
}>;

export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type MyInfoApiOptions = Readonly<{
  apiBaseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImplementation?: typeof fetch;
}>;

export type MyInfoApi = Readonly<{
  getProfile(): Promise<MyProfileResponse>;
  getPreferences(): Promise<MyPreferencesResponse>;
  updatePreferences(request: UpdateMyPreferencesRequest): Promise<MyPreferencesResponse>;
  getSettings(): Promise<MySettingsResponse>;
  updateSettings(request: UpdateMySettingsRequest): Promise<MySettingsResponse>;
  /** 「지도로 보기」가 핀을 한 번에 찍어야 해서 페이지네이션 없이 전체를 받습니다. */
  findMyObstacleReports(): Promise<readonly MyObstacleReportResponse[]>;
  findMyReportPage(query?: MyReportPageQuery): Promise<MyReportPage>;
  findMyConfirmedReportPage(query?: MyConfirmedReportPageQuery): Promise<MyConfirmedReportPage>;
}>;

export class MyInfoApiError extends ApiError {
  constructor(status: number, errorCode: string | undefined, message: string, data?: unknown) {
    super(status, errorCode, message, data);
    this.name = 'MyInfoApiError';
  }
}

const BASE_PATH = '/api/v1/members/me';

export function createMyInfoApi(options?: MyInfoApiOptions): MyInfoApi {
  const client = createHttpClient({
    baseUrl: options?.apiBaseUrl ?? getApiBaseUrl(),
    getAccessToken: options?.getAccessToken,
    fetch: options?.fetchImplementation,
  });

  return {
    async getProfile() {
      try {
        return await client.get<MyProfileResponse>(BASE_PATH);
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },

    async getPreferences() {
      try {
        return await client.get<MyPreferencesResponse>(`${BASE_PATH}/preferences`);
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },

    async updatePreferences(request: UpdateMyPreferencesRequest) {
      try {
        return await client.put<MyPreferencesResponse, UpdateMyPreferencesRequest>(
          `${BASE_PATH}/preferences`,
          request,
        );
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },

    async getSettings() {
      try {
        return await client.get<MySettingsResponse>(`${BASE_PATH}/settings`);
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },

    async updateSettings(request: UpdateMySettingsRequest) {
      try {
        return await client.put<MySettingsResponse, UpdateMySettingsRequest>(
          `${BASE_PATH}/settings`,
          request,
        );
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },

    async findMyObstacleReports() {
      try {
        return await client.get<readonly MyObstacleReportResponse[]>(`${BASE_PATH}/obstacle-reports`);
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },

    async findMyReportPage(query = {}) {
      try {
        return await client.get<MyReportPage>(`${BASE_PATH}/reports${toPageQueryString(query)}`);
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },

    async findMyConfirmedReportPage(query = {}) {
      try {
        return await client.get<MyConfirmedReportPage>(
          `${BASE_PATH}/obstacle-report-confirmations${toPageQueryString(query)}`,
        );
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },
  };
}

/**
 * 커서 페이지 조회의 쿼리스트링.
 * 커서는 BE가 준 값을 그대로 돌려주기만 하면 되므로 인코딩만 하고 해석하지 않습니다.
 */
function toPageQueryString(query: {
  kind?: string;
  status?: string;
  cursor?: string | null;
  size?: number;
}): string {
  const params = new URLSearchParams();

  if (query.kind) {
    params.set('kind', query.kind);
  }
  if (query.status) {
    params.set('status', query.status);
  }
  if (query.cursor) {
    params.set('cursor', query.cursor);
  }
  if (query.size !== undefined) {
    params.set('size', String(query.size));
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `?${queryString}` : '';
}

function toMyInfoApiError(error: unknown): unknown {
  if (error instanceof MyInfoApiError) {
    return error;
  }
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const err = error as { status: number; errorCode?: string; message: string; data?: unknown };
    return new MyInfoApiError(err.status, err.errorCode, err.message, err.data);
  }
  return error;
}
