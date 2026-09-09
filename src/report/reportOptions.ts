import type { MobilityType, ObstacleIssueType, ObstacleSeverity } from '@/obstacleReportApi';
import type { FacilityIssueType } from '@/facilityReportApi';
import type { PlaceAccessStatus, PlaceFacilityStatus, PriorityFacility } from '@/placeReportApi';

import { REPORT_KIND, type ReportKind } from './reportModel';

export type ReportKindOption = {
  readonly kind: ReportKind;
  readonly title: string;
  readonly description: string;
  /**
   * BE에 대응 API가 없어 아직 진행할 수 없는 유형.
   * 장소 상태는 전용 API가 없고, 시설 상태는 nodeId(실내 노드)를 먼저 골라야 합니다.
   */
  readonly disabledReason?: string;
};

/** 제보 01 — 유형 선택. */
export const REPORT_KIND_OPTIONS: readonly ReportKindOption[] = [
  {
    kind: REPORT_KIND.placeState,
    title: '장소 상태',
    description: '공원, 건물, 화장실 등 장소 전반의 상태',
  },
  {
    kind: REPORT_KIND.facilityState,
    title: '시설 상태',
    description: '계단, 경사로, 손잡이 등 시설의 파손이나 고장',
  },
  {
    kind: REPORT_KIND.obstacle,
    title: '길 위 장애물',
    description: '깨진 보도, 높은 턱, 공사 구간 등을 알려주세요',
  },
];

/** 제보 05 — 어떤 장애물인가요? (BE ObstacleIssueType 12종) */
export const ISSUE_TYPE_OPTIONS: readonly { readonly value: ObstacleIssueType; readonly label: string }[] = [
  { value: 'SIDEWALK_DAMAGE', label: '보도 파손' },
  { value: 'HIGH_CURB', label: '높은 턱' },
  { value: 'CONSTRUCTION', label: '공사 구간' },
  { value: 'STEEP_SLOPE', label: '급경사' },
  { value: 'NARROW_PASSAGE', label: '좁은 인도' },
  { value: 'STAIRS', label: '계단' },
  { value: 'LONG_WALKING_DISTANCE', label: '긴 보행 거리' },
  { value: 'OBSTRUCTION', label: '적치물' },
  { value: 'ILLEGAL_PARKING', label: '불법 주차' },
  { value: 'BRAILLE_BLOCK_DAMAGE', label: '점자블록 훼손' },
  { value: 'SLIPPERY_SURFACE', label: '미끄러운 길' },
  { value: 'OTHER', label: '기타' },
];

/**
 * 제보 05 — 누가 영향을 받나요?
 * 시안에는 「시각장애」·「고령자」도 있지만 BE MobilityType이 3종뿐이라
 * 대응되는 값만 노출합니다.
 */
export const MOBILITY_TYPE_OPTIONS: readonly { readonly value: MobilityType; readonly label: string }[] = [
  { value: 'WHEELCHAIR', label: '휠체어' },
  { value: 'STROLLER', label: '유모차' },
  { value: 'SLOW_WALKER', label: '느린 보행' },
];

/**
 * 제보 05 — 통행상태.
 * 라벨은 홈 지도(obstacleSeverityStyle.ts)와 같은 규약을 씁니다.
 */
export const SEVERITY_OPTIONS: readonly { readonly value: ObstacleSeverity; readonly label: string }[] = [
  { value: 'INFO', label: '참고' },
  { value: 'CAUTION', label: '주의' },
  { value: 'IMPASSABLE', label: '우회권장' },
];

/**
 * 제보 03 — 이 장소는 어땠나요? (BE PlaceAccessStatus 3종)
 */
export const PLACE_ACCESS_STATUS_OPTIONS: readonly {
  readonly value: PlaceAccessStatus;
  readonly label: string;
  readonly description: string;
}[] = [
  { value: 'ACCESSIBLE', label: '이용 편했어요', description: '별다른 제약 없이 이용했어요' },
  { value: 'PARTIALLY_ACCESSIBLE', label: '일부 불편했어요', description: '이용은 했지만 제약이 있었어요' },
  { value: 'INACCESSIBLE', label: '이용 어려웠어요', description: '사실상 이용하지 못했어요' },
];

/** 제보 04 — 편의시설별 상태. 고르지 않은 항목은 전송하지 않습니다(「없음」과 「확인 못 함」은 다릅니다). */
export const PLACE_FACILITY_OPTIONS: readonly {
  readonly value: PriorityFacility;
  readonly label: string;
}[] = [
  { value: 'ELEVATOR', label: '엘리베이터' },
  { value: 'ACCESSIBLE_TOILET', label: '장애인 화장실' },
  { value: 'RAMP', label: '경사로' },
  { value: 'PARKING', label: '장애인 주차장' },
];

export const PLACE_FACILITY_STATUS_OPTIONS: readonly {
  readonly value: PlaceFacilityStatus;
  readonly label: string;
}[] = [
  { value: 'AVAILABLE', label: '있어요' },
  { value: 'UNAVAILABLE', label: '없어요' },
  { value: 'BROKEN', label: '고장' },
];

/** 제보 06 — 시설이 어떤 상태인가요? (BE FacilityIssueType 7종) */
export const FACILITY_ISSUE_TYPE_OPTIONS: readonly {
  readonly value: FacilityIssueType;
  readonly label: string;
}[] = [
  { value: 'BROKEN', label: '고장' },
  { value: 'OUT_OF_SERVICE', label: '운영 중지' },
  { value: 'BLOCKED', label: '통행 막힘' },
  { value: 'DAMAGED', label: '파손' },
  { value: 'MISSING', label: '없어짐' },
  { value: 'REPAIRED', label: '수리 완료' },
  { value: 'OTHER', label: '기타' },
];

export const FACILITY_ISSUE_TYPE_LABELS: Record<FacilityIssueType, string> = Object.fromEntries(
  FACILITY_ISSUE_TYPE_OPTIONS.map(option => [option.value, option.label]),
) as Record<FacilityIssueType, string>;

/** 실내 시설 노드 유형(BE facility_nodes.node_type)의 표시 이름. 모르는 값은 원문을 그대로 씁니다. */
export const FACILITY_NODE_TYPE_LABELS: Readonly<Record<string, string>> = {
  ELEVATOR: '엘리베이터',
  TOILET: '장애인 화장실',
  RAMP: '경사로',
  STAIRS: '계단',
  HANDRAIL: '손잡이',
  ENTRANCE: '출입구',
  PARKING: '장애인 주차장',
  ESCALATOR: '에스컬레이터',
};

/** 「2층」·「지하 1층」처럼 사람이 읽는 층 표기. */
export function formatFloorLevel(floorLevel: number | null | undefined): string {
  if (floorLevel === null || floorLevel === undefined) {
    return '층 정보 없음';
  }
  return floorLevel < 0 ? `지하 ${String(Math.abs(floorLevel))}층` : `${String(floorLevel)}층`;
}

export const PLACE_ACCESS_STATUS_LABELS: Record<PlaceAccessStatus, string> = Object.fromEntries(
  PLACE_ACCESS_STATUS_OPTIONS.map(option => [option.value, option.label]),
) as Record<PlaceAccessStatus, string>;

export const ISSUE_TYPE_LABELS: Record<ObstacleIssueType, string> = Object.fromEntries(
  ISSUE_TYPE_OPTIONS.map(option => [option.value, option.label]),
) as Record<ObstacleIssueType, string>;
