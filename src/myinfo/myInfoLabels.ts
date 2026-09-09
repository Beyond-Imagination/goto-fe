import type { ReportListItemData, ReportStatusTag } from '@/components/myinfo/ReportListItem';

import type {
  AvoidCondition,
  MobilityMode,
  MyConfirmedReportResponse,
  MyFacilityReportResponse,
  MyObstacleReportResponse,
  MyPlaceStateReportResponse,
  MyReportItemResponse,
  ObstacleIssueType,
  PlaceAccessStatus,
  PriorityFacility,
} from './myInfoApi';

/** BE enum → 화면 라벨. 온보딩 화면의 한글 표기와 같은 문자열을 씁니다. */
const MOBILITY_MODE_LABELS: Record<MobilityMode, string> = {
  WHEELCHAIR: '휠체어',
  WALK: '도보',
  STROLLER: '유모차',
};

const PRIORITY_FACILITY_LABELS: Record<PriorityFacility, string> = {
  ELEVATOR: '엘리베이터',
  ACCESSIBLE_TOILET: '장애인 화장실',
  RAMP: '경사로',
  PARKING: '주차장',
};

const AVOID_CONDITION_LABELS: Record<AvoidCondition, string> = {
  STAIRS: '계단',
  STEEP_SLOPE: '급경사',
  UNEVEN_SURFACE: '보도 파손',
};

const ISSUE_TYPE_LABELS: Record<ObstacleIssueType, string> = {
  STAIRS: '계단',
  HIGH_CURB: '높은 턱',
  STEEP_SLOPE: '급경사',
  NARROW_PASSAGE: '좁은 통로',
  CONSTRUCTION: '공사 구간',
  SIDEWALK_DAMAGE: '보도 파손',
  LONG_WALKING_DISTANCE: '긴 보행 거리',
  OBSTRUCTION: '적치물',
  ILLEGAL_PARKING: '불법 주차',
  BRAILLE_BLOCK_DAMAGE: '점자블록 훼손',
  SLIPPERY_SURFACE: '미끄러운 길',
  OTHER: '기타',
};

/** 심각도는 색이 아니라 문장으로 함께 전달합니다 (화면기획 설계 원칙 #5). */
const SEVERITY_LABELS = {
  IMPASSABLE: '통행 불가',
  CAUTION: '통행 주의',
  INFO: '참고',
} as const;

export function toMobilityLabels(modes: readonly MobilityMode[]): string[] {
  return modes.map(mode => MOBILITY_MODE_LABELS[mode] ?? mode);
}

export function toPriorityFacilityLabels(facilities: readonly PriorityFacility[]): string[] {
  return facilities.map(facility => PRIORITY_FACILITY_LABELS[facility] ?? facility);
}

export function toAvoidConditionLabels(conditions: readonly AvoidCondition[]): string[] {
  return conditions.map(condition => AVOID_CONDITION_LABELS[condition] ?? condition);
}

/** 「휠체어 기준 · 동행자」 처럼 홈 화면 이름 아래에 붙는 한 줄 요약. */
export function toProfileSummary(modes: readonly MobilityMode[]): string {
  const labels = toMobilityLabels(modes);
  return labels.length > 0 ? `${labels.join(' · ')} 기준` : '이동 방식 미설정';
}

function formatDate(isoDate: string): string {
  return isoDate.slice(0, 10).replace(/-/g, '.');
}

/**
 * BE가 네이버 리버스 지오코딩으로 행정동 주소를 채워 주지만,
 * 키 미설정·호출 실패·매칭 없음이면 null이 오므로 그때만 좌표로 대체 표기합니다.
 */
function toLocationLabel(report: MyObstacleReportResponse): string {
  if (report.address) {
    return report.address;
  }
  return `위치 ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`;
}

function toReportTags(report: MyObstacleReportResponse): ReportStatusTag[] {
  const tags: ReportStatusTag[] = [];

  if (report.status === 'RESOLVED') {
    tags.push({ label: '해결됨', tone: 'blue' });
  } else if (report.stale) {
    tags.push({ label: '확인 필요', tone: 'amber' });
  }

  if (report.confirmedCount > 0) {
    tags.push({ label: `확인 ${report.confirmedCount}명`, tone: 'green' });
  }

  return tags;
}

const PLACE_ACCESS_STATUS_LABELS: Record<PlaceAccessStatus, string> = {
  ACCESSIBLE: '이용 편했어요',
  PARTIALLY_ACCESSIBLE: '일부 불편했어요',
  INACCESSIBLE: '이용 어려웠어요',
};

export function toObstacleReportListItem(report: MyObstacleReportResponse): ReportListItemData {
  return {
    id: String(report.id),
    kind: 'obstacle',
    category: '장애물',
    title: `${ISSUE_TYPE_LABELS[report.issueType] ?? report.issueType} · ${SEVERITY_LABELS[report.severity]}`,
    address: toLocationLabel(report),
    latitude: report.latitude,
    longitude: report.longitude,
    photoUrl: report.photoUrls[0] ?? null,
    meta: `${formatDate(report.createdAt)} · 제보 ID ${report.id}`,
    tags: toReportTags(report),
  };
}

/** 내 제보 기록의 「장소」 분류 항목. 위치·주소는 장소에서 옵니다. */
export function toPlaceReportListItem(report: MyPlaceStateReportResponse): ReportListItemData {
  return {
    id: String(report.id),
    kind: 'place',
    category: '장소',
    title: `${report.placeName} · ${PLACE_ACCESS_STATUS_LABELS[report.accessStatus]}`,
    address: report.address ?? report.placeName,
    // 좌표가 없는 장소도 있어 지도 표시용 값은 0으로 두고, 지도 화면에서 걸러냅니다.
    latitude: report.latitude ?? 0,
    longitude: report.longitude ?? 0,
    photoUrl: report.photoUrls[0] ?? null,
    meta: `${formatDate(report.createdAt)} · 제보 ID ${report.id}`,
    tags: [],
  };
}

/** BE FacilityIssueType 라벨. 목록에 없는 예전 값은 원문을 그대로 보여줍니다. */
const FACILITY_ISSUE_LABELS: Readonly<Record<string, string>> = {
  BROKEN: '고장',
  OUT_OF_SERVICE: '운영 중지',
  BLOCKED: '통행 막힘',
  DAMAGED: '파손',
  MISSING: '없어짐',
  REPAIRED: '수리 완료',
  OTHER: '기타',
};

const FACILITY_NODE_TYPE_LABELS: Readonly<Record<string, string>> = {
  ELEVATOR: '엘리베이터',
  TOILET: '장애인 화장실',
  RAMP: '경사로',
  STAIRS: '계단',
  HANDRAIL: '손잡이',
  ENTRANCE: '출입구',
  PARKING: '장애인 주차장',
  ESCALATOR: '에스컬레이터',
};

function toFloorLabel(floorLevel: number | null): string {
  if (floorLevel === null) {
    return '층 정보 없음';
  }
  return floorLevel < 0 ? `지하 ${String(Math.abs(floorLevel))}층` : `${String(floorLevel)}층`;
}

/** 내 제보 기록의 「시설」 분류 항목. 위치·주소는 시설이 속한 장소에서 옵니다. */
export function toFacilityReportListItem(report: MyFacilityReportResponse): ReportListItemData {
  const facilityLabel =
    report.nodeName ?? FACILITY_NODE_TYPE_LABELS[report.nodeType] ?? report.nodeType;
  const issueLabel = FACILITY_ISSUE_LABELS[report.issueType] ?? report.issueType;

  return {
    id: String(report.id),
    kind: 'facility',
    category: '시설',
    title: `${facilityLabel} · ${issueLabel}`,
    address: `${report.placeName} · ${toFloorLabel(report.floorLevel)}`,
    // 좌표가 없는 노드도 있어 지도 표시용 값은 0으로 두고, 지도 화면에서 걸러냅니다.
    latitude: report.latitude ?? 0,
    longitude: report.longitude ?? 0,
    photoUrl: null,
    meta: `${formatDate(report.createdAt)} · 제보 ID ${report.id}`,
    tags: [],
  };
}

/**
 * 내 제보 기록 목록 항목(분류 합친 응답) → 리스트 아이템.
 * kind에 해당하는 본문만 채워져 오므로, 그 본문을 분류별 변환에 넘깁니다.
 */
export function toReportListItem(item: MyReportItemResponse): ReportListItemData {
  if (item.kind === 'PLACE' && item.place) {
    return toPlaceReportListItem(item.place);
  }
  if (item.kind === 'FACILITY' && item.facility) {
    return toFacilityReportListItem(item.facility);
  }
  if (item.obstacle) {
    return toObstacleReportListItem(item.obstacle);
  }

  // BE가 kind와 본문을 짝지어 내려주므로 여기까지 오면 응답 계약이 깨진 것입니다.
  throw new Error(`제보 본문이 비어 있습니다: kind=${item.kind}`);
}

/** 내가 확인한 리포트(05)는 「아직 있음 / 해결 됨」으로 필터하므로 해결 상태를 함께 넘깁니다. */
export type ConfirmedListItem = ReportListItemData & {
  readonly resolution: '아직 있음' | '해결 됨';
};

export function toConfirmedListItem(confirmation: MyConfirmedReportResponse): ConfirmedListItem {
  const resolved = confirmation.report.status === 'RESOLVED';

  return {
    ...toObstacleReportListItem(confirmation.report),
    id: String(confirmation.confirmationId),
    tags: resolved
      ? [{ label: '해결됨', tone: 'blue' }]
      : [{ label: '아직 있음', tone: 'amber' }],
    resolution: resolved ? '해결 됨' : '아직 있음',
  };
}
