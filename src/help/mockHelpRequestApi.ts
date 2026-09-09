import type {
  CreateHelpRequestRequest,
  FindNearbyHelpRequestsParams,
  HelpPlaceContactsResponse,
  HelpRequestApi,
  HelpRequestResponse,
  NearbyHelpRequestResponse,
} from './helpRequestApi';

/**
 * mock 모드(EXPO_PUBLIC_AUTH_MODE=mock)에서 쓰는 인메모리 도움 요청 어댑터.
 *
 * 서버·로그인 없이 요청 생성 → 대기 → (도우미 쪽) 주변 목록 → 상세 → 수락/거절/완료까지
 * 화면을 확인할 수 있습니다. 상태 변화는 모듈 수준 store에 남으므로 화면을 다시 열어도 이어집니다.
 */

/** 시안 좌표(경주 동궁과월지 인근). */
const MOCK_LOCATION = {
  placeId: 5001,
  placeName: '국립경주박물관',
  locationLabel: '국립경주박물관 정문 앞',
  latitude: 35.834,
  longitude: 129.2265,
} as const;

/** 수락 전 주변 목록에서 쓰는 근사 좌표 자릿수. BE와 같은 소수점 3자리(≈100m)입니다. */
const APPROXIMATE_FRACTION_DIGITS = 3;

const DEFAULT_EXPIRES_IN_MINUTES = 60;

function approximate(value: number): number {
  return Number(value.toFixed(APPROXIMATE_FRACTION_DIGITS));
}

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function buildRequest(overrides: Partial<HelpRequestResponse>): HelpRequestResponse {
  return {
    id: 'mock-help-1',
    status: 'PENDING',
    placeId: MOCK_LOCATION.placeId,
    placeName: MOCK_LOCATION.placeName,
    locationLabel: MOCK_LOCATION.locationLabel,
    latitude: MOCK_LOCATION.latitude,
    longitude: MOCK_LOCATION.longitude,
    floorLevel: null,
    message: '경사로 입구를 못 찾겠어요',
    kinds: ['DOOR_ASSIST'],
    requesterNickname: '경주여행자',
    helperNickname: null,
    requestedAt: new Date().toISOString(),
    expiresAt: minutesFromNow(48),
    acceptedAt: null,
    completedAt: null,
    canceledAt: null,
    shareMessage: '국립경주박물관 정문 앞에서 도움을 기다리고 있어요',
    ...overrides,
  };
}

/**
 * mock 모드의 요청 저장소. 화면마다 어댑터를 새로 만들어도 상태가 남아야 하므로
 * 모듈 수준에 한 벌만 둡니다. (인스턴스에 담으면 화면을 다시 열 때 초기화됩니다.)
 */
/** 처음 열었을 때 보이는 대기 중 요청. 도우미 화면에서 목록·상세를 볼 수 있게 두 건을 둡니다. */
function seedRequests(): HelpRequestResponse[] {
  return [
    buildRequest({ id: 'mock-help-1' }),
    buildRequest({
      id: 'mock-help-2',
      locationLabel: '동궁과월지 매표소',
      message: '문이 무거워서 열기 어려워요',
      kinds: ['WAYFINDING'],
      requesterNickname: '느린걸음',
      latitude: 35.8348,
      longitude: 129.2249,
      expiresAt: minutesFromNow(12),
    }),
  ];
}

const mockStore: { requests: HelpRequestResponse[]; nextId: number } = {
  requests: seedRequests(),
  nextId: 3,
};

export function resetMockHelpRequestStore(): void {
  // 만들어 둔 요청·상태 변화를 모두 버리고 시드로 되돌립니다.
  mockStore.requests = seedRequests();
  mockStore.nextId = 3;
}

function findOrThrow(id: string): HelpRequestResponse {
  const found = mockStore.requests.find(request => request.id === id);

  if (!found) {
    throw new Error('요청 정보를 불러오지 못했어요.');
  }
  return found;
}

function update(id: string, patch: Partial<HelpRequestResponse>): HelpRequestResponse {
  const updated = { ...findOrThrow(id), ...patch };

  mockStore.requests = mockStore.requests.map(request => (request.id === id ? updated : request));
  return updated;
}

function toNearby(request: HelpRequestResponse): NearbyHelpRequestResponse {
  return {
    id: request.id,
    placeId: request.placeId,
    placeName: request.placeName,
    locationLabel: request.locationLabel,
    message: request.message,
    kinds: request.kinds,
    distanceMeters: 180,
    // 수락 전에는 정확한 좌표를 주지 않는 서버 동작을 그대로 흉내 냅니다.
    approximateLatitude: approximate(request.latitude),
    approximateLongitude: approximate(request.longitude),
    requestedAt: request.requestedAt,
    expiresAt: request.expiresAt,
  };
}

const MOCK_PLACE_CONTACTS: HelpPlaceContactsResponse = {
  emergencyContact: { type: 'EMERGENCY', label: '119 구조·구급', telephone: '119', source: null },
  placeContacts: [
    {
      placeId: MOCK_LOCATION.placeId,
      placeName: MOCK_LOCATION.placeName,
      address: '경북 경주시 일정로 186',
      matchType: 'NEARBY_PLACE',
      latitude: MOCK_LOCATION.latitude,
      longitude: MOCK_LOCATION.longitude,
      distanceMeters: 120,
      contactAvailable: true,
      contacts: [
        {
          type: 'PLACE_REPRESENTATIVE',
          label: '국립경주박물관 대표번호',
          telephone: '054-740-7500',
          source: '한국관광공사',
        },
      ],
      homepage: 'https://gyeongju.museum.go.kr',
      thumbnailUrl: null,
    },
    {
      placeId: 5002,
      placeName: '동궁과월지',
      address: '경북 경주시 원화로 102',
      matchType: 'NEARBY_PLACE',
      latitude: 35.8348,
      longitude: 129.2249,
      distanceMeters: 340,
      contactAvailable: false,
      contacts: [],
      homepage: null,
      thumbnailUrl: null,
    },
  ],
};

export function createMockHelpRequestApi(): HelpRequestApi {
  return {
    create: async (request: CreateHelpRequestRequest) => {
      const created = buildRequest({
        id: `mock-help-${String(mockStore.nextId)}`,
        placeId: request.placeId ?? null,
        placeName: request.placeId === null || request.placeId === undefined ? null : MOCK_LOCATION.placeName,
        locationLabel: request.locationLabel,
        latitude: request.latitude,
        longitude: request.longitude,
        floorLevel: request.floorLevel ?? null,
        message: request.message ?? null,
        kinds: request.kinds,
        expiresAt: minutesFromNow(request.expiresInMinutes ?? DEFAULT_EXPIRES_IN_MINUTES),
      });

      mockStore.nextId += 1;
      mockStore.requests = [created, ...mockStore.requests];
      return created;
    },

    findPlaceContacts: async () => MOCK_PLACE_CONTACTS,

    countPending: async () => ({
      pendingCount: mockStore.requests.filter(request => request.status === 'PENDING').length,
    }),

    findNearby: async (_params: FindNearbyHelpRequestsParams) =>
      mockStore.requests.filter(request => request.status === 'PENDING').map(toNearby),

    findMine: async () => mockStore.requests,

    get: async (id: string) => findOrThrow(id),

    accept: async (id: string) =>
      update(id, { status: 'ACCEPTED', acceptedAt: new Date().toISOString(), helperNickname: '도움이' }),

    cancelAccept: async (id: string) =>
      update(id, { status: 'PENDING', acceptedAt: null, helperNickname: null }),

    // 거절은 그 도우미에게만 안 보이게 하는 동작이라, mock에서는 목록에서 빼는 것으로 흉내 냅니다.
    reject: async (id: string) => {
      mockStore.requests = mockStore.requests.filter(request => request.id !== id);
    },

    complete: async (id: string) =>
      update(id, { status: 'COMPLETED', completedAt: new Date().toISOString() }),

    cancel: async (id: string) =>
      update(id, { status: 'CANCELED', canceledAt: new Date().toISOString() }),
  };
}
