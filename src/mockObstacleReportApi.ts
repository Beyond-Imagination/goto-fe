import type {
  CreateObstacleReportRequest,
  ObstacleReportApi,
  ObstacleReportResponse,
  ObstacleReportStatusAction,
} from './obstacleReportApi';

/**
 * mock 모드(EXPO_PUBLIC_AUTH_MODE=mock)에서 쓰는 인메모리 장애물 제보 어댑터.
 * 서버·로그인 없이 제보 등록 → 완료 → 상세 → 상태 변경까지 화면을 확인할 수 있습니다.
 */
const mockStore: { reports: ObstacleReportResponse[]; nextId: number } = {
  reports: [
    {
      id: 1247,
      lat: 37.5665,
      lng: 126.978,
      issueType: 'SIDEWALK_DAMAGE',
      severity: 'CAUTION',
      affectedMobilityTypes: ['WHEELCHAIR'],
      photoUrls: [],
      description: '보도가 깨져서 휠체어가 지나가기 어려워요',
      status: 'ACTIVE',
      stale: false,
      confirmedCount: 5,
      createdAt: '2026-08-12T04:15:30Z',
      lastConfirmedAt: '2026-08-20T04:15:30Z',
    },
  ],
  nextId: 2001,
};

export function resetMockObstacleReportStore(): void {
  mockStore.reports = mockStore.reports.slice(0, 1);
  mockStore.nextId = 2001;
}

function findOrThrow(id: number): ObstacleReportResponse {
  const found = mockStore.reports.find(report => report.id === id);

  if (!found) {
    throw new Error('제보를 찾을 수 없습니다.');
  }
  return found;
}

export function createMockObstacleReportApi(): ObstacleReportApi {
  return {
    getClusters: async () => [],

    create: async (request: CreateObstacleReportRequest) => {
      const created: ObstacleReportResponse = {
        id: mockStore.nextId,
        lat: request.lat,
        lng: request.lng,
        issueType: request.issueType,
        severity: request.severity,
        affectedMobilityTypes: [...request.affectedMobilityTypes],
        photoUrls: [...(request.photoUrls ?? [])],
        description: request.description?.trim() ? request.description.trim() : null,
        status: 'ACTIVE',
        stale: false,
        confirmedCount: 0,
        createdAt: new Date().toISOString(),
        lastConfirmedAt: null,
      };

      mockStore.nextId += 1;
      mockStore.reports = [created, ...mockStore.reports];
      return created;
    },

    get: async (id: number) => findOrThrow(id),

    updateStatus: async (id: number, action: ObstacleReportStatusAction) => {
      const current = findOrThrow(id);
      const updated: ObstacleReportResponse =
        action === 'RESOLVED'
          ? { ...current, status: 'RESOLVED' }
          : {
              ...current,
              confirmedCount: current.confirmedCount + 1,
              lastConfirmedAt: new Date().toISOString(),
              stale: false,
            };

      mockStore.reports = mockStore.reports.map(report => (report.id === id ? updated : report));
      return updated;
    },

    // 업로드 없이 화면을 확인할 수 있도록 고른 사진의 로컬 URI를 그대로 URL처럼 돌려줍니다.
    uploadImage: async image => image.uri,
  };
}
