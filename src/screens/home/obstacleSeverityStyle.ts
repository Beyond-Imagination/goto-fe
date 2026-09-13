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
  STEEP_SLOPE: "급경사",
  // 아래 5종은 전용 아이콘이 아직 없어 Icon.tsx 기본 아이콘으로 표시됩니다.
  OBSTRUCTION: "적치물",
  ILLEGAL_PARKING: "불법주차",
  BRAILLE_BLOCK_DAMAGE: "점자블록훼손",
  SLIPPERY_SURFACE: "미끄러운길",
  OTHER: "기타"
};

export function formatClusterMarkerLabel(severity: ObstacleSeverity, reportCount: number): string {
  return `${SEVERITY_LABEL[severity]} ${String(reportCount)}`;
}

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
