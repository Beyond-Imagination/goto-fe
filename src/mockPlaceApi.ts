import type { FacilityNode, PlaceApi, PlaceDetail, PlaceSearchItem } from './placeApi';

/**
 * mock 모드에서 쓰는 인메모리 장소 어댑터.
 * 장소 검색은 로그인 필요한 API라, 서버 없이 화면을 확인할 때 이 고정 목록을 씁니다.
 */
const MOCK_PLACES: readonly PlaceSearchItem[] = [
  {
    placeId: 5012,
    name: '서울숲 공원',
    categoryCode: 'A0101',
    address: '서울 성동구 뚝섬로 273',
    thumbnailUrl: null,
    latitude: 37.544,
    longitude: 127.037,
    distanceMeters: 120,
    bfDetails: { hasAccessibleToilet: true, hasElevator: true, hasRamp: true },
    hasIndoorMap: false,
  },
  {
    placeId: 5013,
    name: '성수동 주민센터',
    categoryCode: 'A0201',
    address: '서울 성동구 성수이로 118',
    thumbnailUrl: null,
    latitude: 37.5445,
    longitude: 127.0553,
    distanceMeters: 340,
    bfDetails: { hasAccessibleToilet: true, hasElevator: true, hasRamp: true },
    hasIndoorMap: true,
  },
  {
    placeId: 5014,
    name: '뚝섬역 공영화장실',
    categoryCode: 'A0301',
    address: '서울 성동구 왕십리로 41',
    thumbnailUrl: null,
    latitude: 37.5471,
    longitude: 127.0473,
    distanceMeters: 610,
    bfDetails: { hasAccessibleToilet: false, hasElevator: true, hasRamp: true },
    hasIndoorMap: false,
  },
];

/** 실내 도면이 있는 장소(성수동 주민센터, placeId 5013)의 고정 시설 노드. */
const MOCK_FLOORS: readonly number[] = [-1, 1, 2];

const MOCK_NODES: readonly FacilityNode[] = [
  {
    id: 9001,
    floorMapId: 1,
    targetFeatureId: 'node-elevator-1',
    nodeType: 'ELEVATOR',
    name: '본관 엘리베이터',
    lat: 37.5445,
    lng: 127.0553,
    isCheckpoint: true,
    snapRadius: 5,
    locationDescription: '로비 안쪽 복도 끝',
  },
  {
    id: 9002,
    floorMapId: 1,
    targetFeatureId: 'node-toilet-1',
    nodeType: 'TOILET',
    name: '장애인 화장실',
    lat: 37.5446,
    lng: 127.0554,
    isCheckpoint: true,
    snapRadius: 4,
    locationDescription: '1층 로비 서쪽',
  },
  {
    id: 9003,
    floorMapId: 1,
    targetFeatureId: 'node-ramp-1',
    nodeType: 'RAMP',
    name: '정문 경사로',
    lat: 37.5444,
    lng: 127.0552,
    isCheckpoint: false,
    snapRadius: null,
    locationDescription: '정문 오른쪽',
  },
];

function mockDetail(place: PlaceSearchItem): PlaceDetail {
  const warning = place.bfDetails?.hasAccessibleToilet === false;

  return {
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    category: place.categoryCode,
    categoryCode: place.categoryCode,
    thumbnailUrls: place.thumbnailUrl ? [place.thumbnailUrl] : [],
    detailState: warning ? 'WARNING' : 'REPORT_MISSING',
    badges: warning
      ? [{ text: '주의 필요', tone: 'warning' }, { text: '최근 확인됨', tone: 'info' }]
      : [{ text: '제보없음', tone: 'neutral' }],
    summary: warning
      ? { title: '최근 이용에 주의가 필요해요', description: '최근 제보 또는 공식 정보에 불편 상태가 있어요' }
      : { title: '아직 방문 제보가 없어요', description: '공식 정보 기준으로 보여드려요. 다녀오셨다면 알려주세요' },
    issues: warning
      ? [{ id: 1, title: '장애인 화장실 위치 확인이 필요해요', reportedAtLabel: '최근 제보', confirmCount: 1, status: 'UNAVAILABLE' }]
      : [],
    accessibilityRows: [
      {
        key: 'ENTRANCE',
        label: '입구 접근성',
        official: { status: 'AVAILABLE', text: '접근 가능', description: '경사로 있음', reportCtaEnabled: false },
        recent: { status: 'NO_REPORT', text: '제보 없음', description: '제보하기 >', reportCtaEnabled: true },
      },
      {
        key: 'ELEVATOR',
        label: '엘리베이터',
        official: { status: 'AVAILABLE', text: '정상', description: '운영 중', reportCtaEnabled: false },
        recent: { status: 'NO_REPORT', text: '제보 없음', description: '제보하기 >', reportCtaEnabled: true },
      },
      {
        key: 'ACCESSIBLE_TOILET',
        label: '장애인 화장실',
        official: {
          status: warning ? 'UNAVAILABLE' : 'AVAILABLE',
          text: warning ? '주의 필요' : '있음',
          description: warning ? '방문 전 확인이 필요해요' : '장애인 화장실 있음',
          reportCtaEnabled: false,
        },
        recent: { status: 'NO_REPORT', text: '제보 없음', description: '제보하기 >', reportCtaEnabled: true },
      },
      {
        key: 'PARKING',
        label: '주차장',
        official: { status: 'NO_OFFICIAL', text: '공식정보 없음', description: '공공 데이터에 등록된 정보가 없어요', reportCtaEnabled: false },
        recent: { status: 'NO_REPORT', text: '제보 없음', description: '제보하기 >', reportCtaEnabled: true },
      },
      {
        key: 'NURSING_ROOM',
        label: '수유실',
        official: { status: 'NO_OFFICIAL', text: '공식정보 없음', description: '공공 데이터에 등록된 정보가 없어요', reportCtaEnabled: false },
        recent: { status: 'NO_REPORT', text: '제보 없음', description: '제보하기 >', reportCtaEnabled: true },
      },
    ],
    notice: warning ? '이 정보는 공식 정보와 최근 제보를 기반으로 해요' : '이 정보는 공식 정보만으로 구성돼 있어요',
  };
}

export function createMockPlaceApi(): PlaceApi {
  return {
    getNearbySummary: async () => ({
      detourRecommendedCount: 1,
      cautionCount: 3,
      safeCount: 5,
      needsConfirmationCount: 2,
    }),

    listFloors: async () => [...MOCK_FLOORS],

    listFacilityNodes: async (_placeId: number, floor: number) =>
      // 1층에만 노드를 두어, 도면은 있지만 등록된 시설이 없는 층도 확인할 수 있게 합니다.
      floor === 1 ? MOCK_NODES.map(node => ({ ...node })) : [],

    searchPlaces: async (_lat: number, _lng: number, options = {}) => {
      const keyword = options.keyword?.trim().toLowerCase();
      const filteredPlaces = keyword
        ? MOCK_PLACES.filter(place =>
            `${place.name} ${place.address}`.toLowerCase().includes(keyword),
          )
        : MOCK_PLACES;

      return {
        places: filteredPlaces.slice(0, options.k ?? filteredPlaces.length).map(place => ({ ...place })),
      };
    },

    getPlaceDetail: async (placeId: number) => {
      const place = MOCK_PLACES.find(item => item.placeId === placeId) ?? MOCK_PLACES[0]!;
      return mockDetail(place);
    },
  };
}
