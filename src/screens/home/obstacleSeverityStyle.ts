import type { ObstacleIssueType, ObstacleSeverity } from "@/obstacleReportApi";
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
