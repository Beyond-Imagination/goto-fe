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
  | 'LONG_WALKING_DISTANCE';

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
   * TODO(GOTO-110): BE에 역지오코딩(또는 Place 연관)이 들어오면 실제 주소가 채워집니다.
   *  지금은 ObstacleReport에 좌표만 있어 항상 null이고, toReportListItem이 좌표 문자열로 대체합니다.
   */
  address: string | null;
  photoUrls: readonly string[];
  confirmedCount: number;
  lastConfirmedAt: string | null;
  createdAt: string;
}>;

export type MyConfirmedReportResponse = Readonly<{
  confirmationId: number;
  confirmedAt: string;
  report: MyObstacleReportResponse;
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
  findMyReports(): Promise<readonly MyObstacleReportResponse[]>;
  findMyConfirmedReports(): Promise<readonly MyConfirmedReportResponse[]>;
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

    async findMyReports() {
      try {
        return await client.get<readonly MyObstacleReportResponse[]>(`${BASE_PATH}/obstacle-reports`);
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },

    async findMyConfirmedReports() {
      try {
        return await client.get<readonly MyConfirmedReportResponse[]>(
          `${BASE_PATH}/obstacle-report-confirmations`,
        );
      } catch (error) {
        throw toMyInfoApiError(error);
      }
    },
  };
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
