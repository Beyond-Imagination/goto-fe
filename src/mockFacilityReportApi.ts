import type {
  CreateFacilityReportRequest,
  FacilityReportApi,
  FacilityReportResponse,
} from './facilityReportApi';

/** mock 모드에서 쓰는 인메모리 시설 제보 어댑터. mockPlaceApi의 고정 노드와 짝을 맞춥니다. */
const MOCK_NODES = {
  9001: { nodeType: 'ELEVATOR', nodeName: '본관 엘리베이터', isCheckpoint: true, snapRadius: 5 },
  9002: { nodeType: 'TOILET', nodeName: '장애인 화장실', isCheckpoint: true, snapRadius: 4 },
  9003: { nodeType: 'RAMP', nodeName: '정문 경사로', isCheckpoint: false, snapRadius: null },
} as const;

const mockStore: { reports: FacilityReportResponse[]; nextId: number } = {
  reports: [
    {
      id: 77,
      nodeId: 9001,
      nodeType: 'ELEVATOR',
      nodeName: '본관 엘리베이터',
      floorLevel: 1,
      placeId: 5013,
      placeName: '성수동 주민센터',
      latitude: 37.5445,
      longitude: 127.0553,
      issueType: 'BROKEN',
      description: '점검 안내문만 붙어 있고 언제 고쳐지는지 안 적혀 있어요',
      createdAt: '2026-08-18T04:15:30Z',
      calibration: null,
    },
  ],
  nextId: 201,
};

export function resetMockFacilityReportStore(): void {
  mockStore.reports = mockStore.reports.slice(0, 1);
  mockStore.nextId = 201;
}

export function createMockFacilityReportApi(): FacilityReportApi {
  return {
    create: async (request: CreateFacilityReportRequest) => {
      const node = MOCK_NODES[request.nodeId as keyof typeof MOCK_NODES] ?? MOCK_NODES[9001];
      const createdAt = new Date().toISOString();
      const created: FacilityReportResponse = {
        id: mockStore.nextId,
        nodeId: request.nodeId,
        nodeType: node.nodeType,
        nodeName: node.nodeName,
        floorLevel: 1,
        placeId: 5013,
        placeName: '성수동 주민센터',
        latitude: 37.5445,
        longitude: 127.0553,
        issueType: request.issueType,
        description: request.description?.trim() ? request.description.trim() : null,
        createdAt,
        // 체크포인트 노드면 서버처럼 위치 보정 정보를 함께 돌려줍니다.
        calibration: node.isCheckpoint
          ? {
              confirmedAt: createdAt,
              latitude: 37.5445,
              longitude: 127.0553,
              floorLevel: 1,
              snapRadius: node.snapRadius,
            }
          : null,
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
  };
}
