import type { SavedPlaceApi, SavedPlaceResponse } from './savedPlaceApi';
import { SavedPlaceApiError } from './savedPlaceApi';

/** mock 모드에서 저장 화면을 확인할 수 있도록 채워둔 장소들. */
const SEED_PLACES: readonly SavedPlaceResponse[] = [
  {
    placeId: 4102,
    name: '국립중앙박물관',
    category: '박물관',
    address: '서울 용산구 서빙고로 137',
    thumbnailUrl: null,
    latitude: 37.52385,
    longitude: 126.98047,
    hasIndoorMap: true,
    isAvailable: true,
    savedAt: '2026-09-02T02:10:00Z',
    notificationEnabled: true,
    latestAccessStatus: 'ACCESSIBLE',
    latestReportedAt: '2026-09-05T05:30:00Z',
  },
  {
    placeId: 3311,
    name: '서울숲 공원',
    category: '공원',
    address: '서울 성동구 뚝섬로 273',
    thumbnailUrl: null,
    latitude: 37.5443,
    longitude: 127.0374,
    hasIndoorMap: false,
    isAvailable: true,
    savedAt: '2026-08-28T08:40:00Z',
    notificationEnabled: true,
    latestAccessStatus: 'PARTIALLY_ACCESSIBLE',
    latestReportedAt: '2026-09-08T01:05:00Z',
  },
  {
    placeId: 2870,
    name: '광화문 시민열린마당',
    category: '광장',
    address: '서울 종로구 사직로 96',
    thumbnailUrl: null,
    latitude: 37.5758,
    longitude: 126.9754,
    hasIndoorMap: false,
    isAvailable: true,
    savedAt: '2026-07-19T11:00:00Z',
    notificationEnabled: false,
    latestAccessStatus: 'INACCESSIBLE',
    latestReportedAt: '2026-07-20T02:00:00Z',
  },
  {
    placeId: 1990,
    name: '한강 뚝섬 전망문화콤플렉스',
    category: '전시관',
    address: '서울 광진구 강변북로 139',
    thumbnailUrl: null,
    latitude: 37.5312,
    longitude: 127.0699,
    hasIndoorMap: true,
    isAvailable: true,
    savedAt: '2026-06-30T05:20:00Z',
    notificationEnabled: true,
    latestAccessStatus: null,
    latestReportedAt: null,
  },
];

/**
 * 화면을 다시 열어도 하트·알림 설정이 남아 있어야 하므로 모듈 수준에 둡니다.
 * (createMockSavedPlaceApi는 화면이 리마운트될 때마다 새로 호출됩니다.)
 */
let store: SavedPlaceResponse[] = SEED_PLACES.map(place => ({ ...place }));

export function resetMockSavedPlaceStore(): void {
  store = SEED_PLACES.map(place => ({ ...place }));
}

export function createMockSavedPlaceApi(): SavedPlaceApi {
  return {
    async findMine() {
      return store
        .slice()
        .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
        .map(place => ({ ...place }));
    },

    async save(placeId: number) {
      if (store.some(place => place.placeId === placeId)) {
        return;
      }

      // 목록 화면에서만 쓰는 어댑터라 장소 원본이 없습니다. 하트를 켠 사실만 남깁니다.
      store = [
        ...store,
        {
          placeId,
          name: `저장한 장소 ${placeId}`,
          category: null,
          address: null,
          thumbnailUrl: null,
          latitude: null,
          longitude: null,
          hasIndoorMap: false,
          isAvailable: true,
          savedAt: new Date().toISOString(),
          notificationEnabled: true,
          latestAccessStatus: null,
          latestReportedAt: null,
        },
      ];
    },

    async unsave(placeId: number) {
      store = store.filter(place => place.placeId !== placeId);
    },

    async updateNotification(placeId: number, enabled: boolean) {
      const target = store.find(place => place.placeId === placeId);
      if (!target) {
        throw new SavedPlaceApiError(404, 'SAVED_PLACE_NOT_FOUND', '저장하지 않은 장소입니다.');
      }

      const updated = { ...target, notificationEnabled: enabled };
      store = store.map(place => (place.placeId === placeId ? updated : place));
      return { ...updated };
    },
  };
}
