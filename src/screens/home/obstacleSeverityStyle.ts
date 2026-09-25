import type { ObstacleIssueType, ObstacleReportCluster, ObstacleSeverity } from "@/obstacleReportApi";
import { colors } from "@/styles/tokens/colors";

/**
 * 먼 줌 4분류 라벨. `ObstacleSeverity`는 3단계(IMPASSABLE/CAUTION/INFO)뿐이고 "안전"은
 * INFO를 부르는 이름일 뿐 별도 값이 아니다. "확인필요"는 severity와 무관한 STALE 축이라
 * 여기 포함하지 않는다 (CONTEXT.md "심각도 (ObstacleSeverity) / 먼 줌 4분류" 참고).
 */
export const SEVERITY_LABEL: Record<ObstacleSeverity, string> = {
  IMPASSABLE: "우회권장",
  CAUTION: "주의",
  INFO: "안전"
};

export const SEVERITY_COLOR: Record<ObstacleSeverity, string> = {
  IMPASSABLE: colors.semantic.danger.DEFAULT,
  CAUTION: colors.semantic.warning.DEFAULT,
  INFO: colors.semantic.info.DEFAULT
};

export const NEEDS_CONFIRMATION_LABEL = "확인필요";
export const NEEDS_CONFIRMATION_COLOR = colors.neutral[500];

// src/components/icons/Icon.tsx의 IconName 한글 라벨과 1:1 대응.
export const ISSUE_TYPE_LABEL: Record<ObstacleIssueType, string> = {
  CONSTRUCTION: "공사구간",
  HIGH_CURB: "높은턱",
  LONG_WALKING_DISTANCE: "긴보행거리",
  NARROW_PASSAGE: "좁은통로",
  SIDEWALK_DAMAGE: "보도파손",
  STAIRS: "계단",
  STEEP_SLOPE: "급경사"
};

/**
 * 타입은 BE enum 7종으로 좁혀졌지만 런타임 응답은 그 밖의 값이 올 수 있다(BE에 유형이 새로
 * 추가되고 FE가 아직 배포 전인 경우 등). 아이콘·라벨 맵은 이제 Partial이 아니라서 모르는 값을
 * 그대로 조회하면 undefined가 되어 렌더 중 크래시하므로, 조회 전에 이 가드로 거른다.
 */
export function isKnownIssueType(value: string): boolean {
  return Object.prototype.hasOwnProperty.call(ISSUE_TYPE_LABEL, value);
}

/** 클러스터 대표 이슈유형(topIssueTypes[0]). 없거나 FE가 모르는 값이면 undefined. */
export function clusterDominantIssueType(cluster: ObstacleReportCluster): ObstacleIssueType | undefined {
  const issueType = cluster.topIssueTypes[0]?.issueType;
  return issueType !== undefined && isKnownIssueType(issueType) ? issueType : undefined;
}

export function formatClusterMarkerLabel(severity: ObstacleSeverity, reportCount: number): string {
  return `${SEVERITY_LABEL[severity]} ${String(reportCount)}`;
}

/**
 * "현재 화면 제보" 통계 카드(CurrentScreenReportStats)용 카테고리 식별자.
 * ObstacleIssueType을 그대로 key로 안 쓰는 이유: 그 컴포넌트의 데이터 계약이 범용 문자열
 * `categoryId`를 요구해서(다른 화면·다른 분류 체계에서도 재사용할 수 있게) — 지금은
 * ObstacleIssueType을 lowercase로 바꾼 값을 쓴다.
 */
export function issueTypeStatCategoryId(issueType: ObstacleIssueType): string {
  return issueType.toLowerCase();
}

/**
 * ⚠️ 임시값 — 실제 카피 확정 전 placeholder. 참고 스크린샷엔 "높은턱 → 이동 경로의 단차"
 * 하나만 나와 있어 그대로 쓰고, 나머지 6종은 비슷한 톤으로 새로 썼다. 콘텐츠팀 확인 필요.
 */
export const ISSUE_TYPE_STAT_SUB_DESCRIPTION: Record<ObstacleIssueType, string> = {
  HIGH_CURB: "이동 경로의 단차", // Figma 실측
  STAIRS: "계단으로 인한 이동 제약",
  STEEP_SLOPE: "경사가 급한 구간",
  NARROW_PASSAGE: "폭이 좁은 통행로",
  CONSTRUCTION: "공사로 인한 통행 제한",
  SIDEWALK_DAMAGE: "파손된 보도면",
  LONG_WALKING_DISTANCE: "먼 우회 이동 거리"
};

/**
 * 중간 줌 이슈유형 마커의 건수 구간별 색상. 심각도와 무관하게 이 클러스터의 대표 이슈유형이
 * 몇 건인지로만 구분한다. Figma "중간 줌" 실측(마커 이미지 픽셀 샘플링) 값 — 앱 기존
 * semantic 토큰과는 일치하지 않는 이 화면 전용 색이라 별도 상수로 둔다.
 */
export const ISSUE_TYPE_MARKER_COUNT_THRESHOLD = 10;

export const ISSUE_TYPE_MARKER_COLOR = {
  high: "#ED782F",
  low: "#5D9E52"
} as const;

/**
 * 마커 원 지름(px, issueTypeMarkerSize()가 그대로 반환) — 색상과 같은 건수 구간 경계를 쓴다.
 * Figma "10 이상"/"1 이상" 실측 원 지름 비율(77:60 ≈ 1.283)과 사실상 같은 비율(90:70 ≈
 * 1.286).
 */
export const ISSUE_TYPE_MARKER_SIZE = {
  high: 90,
  low: 70
} as const;

export function issueTypeMarkerColor(reportCount: number): string {
  return reportCount >= ISSUE_TYPE_MARKER_COUNT_THRESHOLD
    ? ISSUE_TYPE_MARKER_COLOR.high
    : ISSUE_TYPE_MARKER_COLOR.low;
}

type ClusterStaleFields = Pick<ObstacleReportCluster, "maxSeverity" | "reportCount" | "staleReportCount">;

/**
 * 클러스터 안의 리포트가 전부 STALE(30일 미확인)이면 severity와 무관하게 "확인필요"(회색)로
 * 덮어쓴다 — STALE은 severity와 독립된 축이라 4분류 매핑에서 severity보다 우선한다
 * (CONTEXT.md "심각도 (ObstacleSeverity) / 먼 줌 4분류" 참고). 일부만 stale인 클러스터는
 * 아직 활성 리포트가 섞여 있으므로 severity 색/라벨을 그대로 쓴다.
 */
function isClusterStale(cluster: ClusterStaleFields): boolean {
  return cluster.reportCount > 0 && cluster.staleReportCount >= cluster.reportCount;
}

export function clusterSeverityColor(cluster: ClusterStaleFields): string {
  return isClusterStale(cluster) ? NEEDS_CONFIRMATION_COLOR : SEVERITY_COLOR[cluster.maxSeverity];
}

export function clusterSeverityLabel(cluster: ClusterStaleFields): string {
  return isClusterStale(cluster) ? NEEDS_CONFIRMATION_LABEL : SEVERITY_LABEL[cluster.maxSeverity];
}
