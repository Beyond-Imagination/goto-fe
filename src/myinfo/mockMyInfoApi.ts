import type {
  MyConfirmedReportPageQuery,
  MyConfirmedReportResponse,
  MyInfoApi,
  MyFacilityReportResponse,
  MyObstacleReportResponse,
  MyPlaceStateReportResponse,
  MyPreferencesResponse,
  MyReportItemResponse,
  MyReportPageQuery,
  MyProfileResponse,
  MySettingsResponse,
  UpdateMyPreferencesRequest,
  UpdateMySettingsRequest,
} from './myInfoApi';

const MOCK_REPORTS: readonly MyObstacleReportResponse[] = [
  {
    id: 1247,
    issueType: 'SIDEWALK_DAMAGE',
    severity: 'CAUTION',
    status: 'ACTIVE',
    stale: false,
    affectedMobilityTypes: ['WHEELCHAIR'],
    latitude: 37.5665,
    longitude: 126.978,
    address: '마포구 상암동',
    photoUrls: [],
    description: '보도가 깨져서 휠체어가 지나가기 어려워요',
    confirmedCount: 5,
    lastConfirmedAt: '2026-08-20T04:15:30Z',
    createdAt: '2026-08-12T04:15:30Z',
  },
  {
    id: 1183,
    issueType: 'CONSTRUCTION',
    severity: 'INFO',
    status: 'ACTIVE',
    stale: false,
    affectedMobilityTypes: ['WHEELCHAIR', 'STROLLER'],
    latitude: 37.5701,
    longitude: 126.9768,
    address: '종로구 세종로',
    photoUrls: [],
    description: null,
    confirmedCount: 2,
    lastConfirmedAt: '2026-08-18T04:15:30Z',
    createdAt: '2026-08-08T04:15:30Z',
  },
  {
    id: 1092,
    issueType: 'HIGH_CURB',
    severity: 'IMPASSABLE',
    status: 'RESOLVED',
    stale: false,
    affectedMobilityTypes: ['WHEELCHAIR'],
    latitude: 37.5588,
    longitude: 126.9366,
    address: '서대문구 연희동',
    photoUrls: [],
    description: null,
    confirmedCount: 3,
    lastConfirmedAt: '2026-08-05T04:15:30Z',
    createdAt: '2026-08-03T04:15:30Z',
  },
];

const MOCK_PLACE_REPORTS: readonly MyPlaceStateReportResponse[] = [
  {
    id: 31,
    placeId: 5012,
    placeName: '서울숲 공원',
    address: '서울 성동구 뚝섬로 273',
    latitude: 37.544,
    longitude: 127.037,
    accessStatus: 'PARTIALLY_ACCESSIBLE',
    facilityStatuses: { ELEVATOR: 'BROKEN', ACCESSIBLE_TOILET: 'AVAILABLE' },
    photoUrls: [],
    description: '정문 경사로는 있지만 문이 무거워요',
    createdAt: '2026-08-15T04:15:30Z',
  },
];

const MOCK_FACILITY_REPORTS: readonly MyFacilityReportResponse[] = [
  {
    id: 77,
    nodeId: 9001,
    nodeType: 'ELEVATOR',
    nodeName: '본관 엘리베이터',
    floorLevel: 1,
    placeId: 5013,
    placeName: '성수동 주민센터',
    address: '서울 성동구 성수이로 118',
    latitude: 37.5445,
    longitude: 127.0553,
    issueType: 'BROKEN',
    description: '점검 안내문만 붙어 있고 언제 고쳐지는지 안 적혀 있어요',
    createdAt: '2026-08-18T04:15:30Z',
  },
];

const MOCK_CONFIRMATIONS: readonly MyConfirmedReportResponse[] = [
  { confirmationId: 31, confirmedAt: '2026-08-21T04:15:30Z', report: MOCK_REPORTS[0] },
  { confirmationId: 30, confirmedAt: '2026-08-19T04:15:30Z', report: MOCK_REPORTS[1] },
  { confirmationId: 29, confirmedAt: '2026-08-06T04:15:30Z', report: MOCK_REPORTS[2] },
];

/**
 * mock 모드의 저장 상태. 화면마다 어댑터를 새로 만들어도 저장한 값이 남아야 하므로
 * 모듈 수준에 한 벌만 둡니다. (인스턴스에 담으면 화면을 다시 열 때 초기화됩니다.)
 */
const mockStore: { preferences: MyPreferencesResponse; settings: MySettingsResponse } = {
  preferences: {
    mobilityModes: ['WHEELCHAIR'],
    priorityFacilities: ['ELEVATOR', 'ACCESSIBLE_TOILET', 'RAMP'],
    avoidConditions: ['STAIRS', 'STEEP_SLOPE'],
  },
  settings: {
    // 서버 기본값과 같습니다 — 알림은 켜고 시작하고, 기기 알림 권한만 사용자가 허용하면 됩니다.
    notifications: {
      savedPlaceStatusChange: true,
      savedPlaceNearbyObstacle: true,
      myReportConfirmed: true,
      myReportConfirmationRequested: true,
      nearbyHelpRequest: true,
      myHelpRequestAccepted: true,
    },
    display: {
      largeText: false,
      highContrast: false,
      vibration: false,
      statusAlerts: false,
    },
  },
};

/** 테스트에서 저장 상태를 초기화할 때 씁니다. */
export function resetMockMyInfoStore(): void {
  mockStore.preferences = {
    mobilityModes: ['WHEELCHAIR'],
    priorityFacilities: ['ELEVATOR', 'ACCESSIBLE_TOILET', 'RAMP'],
    avoidConditions: ['STAIRS', 'STEEP_SLOPE'],
  };
  mockStore.settings = {
    // 서버 기본값과 같습니다 — 알림은 켜고 시작하고, 기기 알림 권한만 사용자가 허용하면 됩니다.
    notifications: {
      savedPlaceStatusChange: true,
      savedPlaceNearbyObstacle: true,
      myReportConfirmed: true,
      myReportConfirmationRequested: true,
      nearbyHelpRequest: true,
      myHelpRequestAccepted: true,
    },
    display: { largeText: false, highContrast: false, vibration: false, statusAlerts: false },
  };
}

function toObstacleItem(report: MyObstacleReportResponse): MyReportItemResponse {
  return { kind: 'OBSTACLE', createdAt: report.createdAt, obstacle: report, place: null, facility: null };
}

function toPlaceItem(report: MyPlaceStateReportResponse): MyReportItemResponse {
  return { kind: 'PLACE', createdAt: report.createdAt, obstacle: null, place: report, facility: null };
}

function toFacilityItem(report: MyFacilityReportResponse): MyReportItemResponse {
  return { kind: 'FACILITY', createdAt: report.createdAt, obstacle: null, place: null, facility: report };
}

/**
 * mock 커서는 "다음에 읽을 위치(offset)" 문자열입니다. 실제 서버 커서는 분류별 (created_at, id)를
 * 담은 base64지만, 화면 입장에서는 받은 값을 그대로 돌려주는 불투명한 문자열이라 이걸로 충분합니다.
 */
function sliceMockPage<T>(
  all: readonly T[],
  cursor: string | null | undefined,
  size: number | undefined,
): { items: readonly T[]; nextCursor: string | null } {
  const pageSize = size ?? 20;
  const offset = cursor ? Number(cursor) : 0;
  const items = all.slice(offset, offset + pageSize);
  const nextOffset = offset + items.length;

  return { items, nextCursor: nextOffset < all.length ? String(nextOffset) : null };
}

/**
 * mock 모드에서 쓰는 인메모리 어댑터.
 */
export function createMockMyInfoApi(): MyInfoApi {
  return {
    getProfile: async (): Promise<MyProfileResponse> => ({
      nickname: '경주여행자',
      mobilityModes: mockStore.preferences.mobilityModes,
      stats: { reportCount: 12, helpedPeopleCount: 48, resolvedConfirmationCount: 3 },
    }),

    getPreferences: async () => mockStore.preferences,

    updatePreferences: async (request: UpdateMyPreferencesRequest) => {
      mockStore.preferences = {
        mobilityModes: [...request.mobilityModes],
        priorityFacilities: [...request.priorityFacilities],
        avoidConditions: [...request.avoidConditions],
      };
      return mockStore.preferences;
    },

    getSettings: async () => mockStore.settings,

    updateSettings: async (request: UpdateMySettingsRequest) => {
      mockStore.settings = {
        notifications: { ...request.notifications },
        display: { ...request.display },
      };
      return mockStore.settings;
    },

    findMyObstacleReports: async () => MOCK_REPORTS,

    findMyReportPage: async (query: MyReportPageQuery = {}) => {
      const all = [
        ...(query.kind === undefined || query.kind === 'OBSTACLE'
          ? MOCK_REPORTS.map(toObstacleItem)
          : []),
        ...(query.kind === undefined || query.kind === 'PLACE' ? MOCK_PLACE_REPORTS.map(toPlaceItem) : []),
        ...(query.kind === undefined || query.kind === 'FACILITY'
          ? MOCK_FACILITY_REPORTS.map(toFacilityItem)
          : []),
      ].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

      return sliceMockPage(all, query.cursor, query.size);
    },

    findMyConfirmedReportPage: async (query: MyConfirmedReportPageQuery = {}) => {
      const filtered =
        query.status === undefined
          ? MOCK_CONFIRMATIONS
          : MOCK_CONFIRMATIONS.filter(confirmation => confirmation.report.status === query.status);

      return sliceMockPage([...filtered], query.cursor, query.size);
    },
  };
}
