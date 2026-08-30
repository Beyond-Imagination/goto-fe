import type { ReportListItemData, ReportStatusTag } from '@/components/myinfo/ReportListItem';

import type {
  AvoidCondition,
  MobilityMode,
  MyConfirmedReportResponse,
  MyObstacleReportResponse,
  ObstacleIssueType,
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
 * TODO(GOTO-110): BE가 address를 채워주면 이 좌표 대체 표기를 제거합니다.
 *  디자인(내 정보 03·05)은 "서울시 마포구 월드컵로 23길" 같은 주소를 기대하는데,
 *  현재 BE는 역지오코딩이 없어 address가 항상 null이라 좌표로 대신 보여줍니다.
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

export function toReportListItem(report: MyObstacleReportResponse): ReportListItemData {
  return {
    id: String(report.id),
    // TODO(GOTO-110): BE에 장소·시설 제보 조회가 추가되면 응답의 제보 종류로 분류를 정합니다.
    //  지금은 장애물 제보만 내려오므로 고정값이고, 내 제보 기록의 「장소」·「시설」 필터는 항상 빈 목록입니다.
    category: '장애물',
    title: `${ISSUE_TYPE_LABELS[report.issueType] ?? report.issueType} · ${SEVERITY_LABELS[report.severity]}`,
    address: toLocationLabel(report),
    meta: `${formatDate(report.createdAt)} · 제보 ID ${report.id}`,
    tags: toReportTags(report),
  };
}

/** 내가 확인한 리포트(05)는 「아직 있음 / 해결 됨」으로 필터하므로 해결 상태를 함께 넘깁니다. */
export type ConfirmedListItem = ReportListItemData & {
  readonly resolution: '아직 있음' | '해결 됨';
};

export function toConfirmedListItem(confirmation: MyConfirmedReportResponse): ConfirmedListItem {
  const resolved = confirmation.report.status === 'RESOLVED';

  return {
    ...toReportListItem(confirmation.report),
    id: String(confirmation.confirmationId),
    tags: resolved
      ? [{ label: '해결됨', tone: 'blue' }]
      : [{ label: '아직 있음', tone: 'amber' }],
    resolution: resolved ? '해결 됨' : '아직 있음',
  };
}
