import type {
  CreatePlaceStateReportRequest,
  PlaceReportApi,
  PlaceStateReportResponse,
} from './placeReportApi';

/**
 * mock 모드에서 쓰는 인메모리 장소 상태 제보 어댑터.
 * 장소 검색이 로그인 필요한 API라, mock 모드에서는 이 어댑터가 고정 장소를 씁니다.
 */
const MOCK_PLACE = {
  placeId: 5012,
  placeName: '서울숲 공원',
  placeAddress: '서울 성동구 뚝섬로 273',
  latitude: 37.544,
  longitude: 127.037,
} as const;

const mockStore: { reports: PlaceStateReportResponse[]; nextId: number } = {
  reports: [
    {
      ...MOCK_PLACE,
      id: 31,
      accessStatus: 'PARTIALLY_ACCESSIBLE',
      facilityStatuses: { ELEVATOR: 'BROKEN', ACCESSIBLE_TOILET: 'AVAILABLE' },
      photoUrls: [],
      description: '정문 경사로는 있지만 문이 무거워요',
      createdAt: '2026-08-15T04:15:30Z',
    },
  ],
  nextId: 101,
};

export function resetMockPlaceReportStore(): void {
  mockStore.reports = mockStore.reports.slice(0, 1);
  mockStore.nextId = 101;
}

export function createMockPlaceReportApi(): PlaceReportApi {
  return {
    create: async (request: CreatePlaceStateReportRequest) => {
      const created: PlaceStateReportResponse = {
        ...MOCK_PLACE,
        placeId: request.placeId,
        id: mockStore.nextId,
        accessStatus: request.accessStatus,
        facilityStatuses: { ...request.facilityStatuses },
        photoUrls: [...(request.photoUrls ?? [])],
        description: request.description?.trim() ? request.description.trim() : null,
        createdAt: new Date().toISOString(),
      };

      mockStore.nextId += 1;
      mockStore.reports = [created, ...mockStore.reports];
      return created;
    },

    get: async (id: number) => {
      const found = mockStore.reports.find(report => report.id === id);

      if (!found) {
        throw new Error('제보를 찾을 수 없습니다.');
      }
      return found;
    },

    findByPlace: async (placeId: number) =>
      mockStore.reports.filter(report => report.placeId === placeId),
  };
}
