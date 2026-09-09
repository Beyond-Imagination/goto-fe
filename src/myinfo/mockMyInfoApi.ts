import type {
  MyConfirmedReportResponse,
  MyInfoApi,
  MyFacilityReportResponse,
  MyObstacleReportResponse,
  MyPlaceStateReportResponse,
  MyPreferencesResponse,
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
    notifications: {
      savedPlaceStatusChange: false,
      savedPlaceNearbyObstacle: false,
      myReportConfirmed: false,
      myReportConfirmationRequested: false,
      nearbyHelpRequest: false,
      myHelpRequestAccepted: false,
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
    notifications: {
      savedPlaceStatusChange: false,
      savedPlaceNearbyObstacle: false,
      myReportConfirmed: false,
      myReportConfirmationRequested: false,
      nearbyHelpRequest: false,
      myHelpRequestAccepted: false,
    },
    display: { largeText: false, highContrast: false, vibration: false, statusAlerts: false },
  };
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

    findMyReports: async () => MOCK_REPORTS,

    findMyPlaceStateReports: async () => MOCK_PLACE_REPORTS,

    findMyFacilityReports: async () => MOCK_FACILITY_REPORTS,

    findMyConfirmedReports: async () => MOCK_CONFIRMATIONS,
  };
}
