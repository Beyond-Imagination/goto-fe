import type { FacilityNode, PlaceApi, PlaceSearchItem } from './placeApi';

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

    searchPlaces: async (_lat: number, _lng: number, options = {}) => ({
      places: MOCK_PLACES.slice(0, options.k ?? MOCK_PLACES.length).map(place => ({ ...place })),
    }),
  };
}
