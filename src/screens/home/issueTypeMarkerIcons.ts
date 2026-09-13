import type { ImageRequireSource } from "react-native";

import type { IconName } from "@/components/icons/Icon";
import type { ObstacleIssueType } from "@/obstacleReportApi";

import { ISSUE_TYPE_MARKER_COLOR, ISSUE_TYPE_MARKER_COUNT_THRESHOLD, ISSUE_TYPE_MARKER_SIZE } from "./obstacleSeverityStyle";
import { tieredValue } from "./tieredValue";

/**
 * 중간 줌 마커용: 이슈유형 아이콘 + 원형 테두리 + 반투명 흰 배경을 미리 합성한 정적 이미지.
 * NaverMapMarkerOverlay의 커스텀 View 스냅샷 방식은 이 네이티브 빌드에서 텍스트/이미지
 * 콘텐츠가 렌더링되지 않는 버그가 있어(캡처 타이밍 문제), 그 경로를 완전히 피하기 위해
 * 정적 리소스(require) 이미지 타입을 대신 쓴다 — 이 타입은 커스텀 View 스냅샷과 무관한
 * 별도 네이티브 경로라 안정적으로 렌더링된다.
 *
 * `ObstacleIssueType` 12종 중 전용 아트가 있는 7종만 키로 둔다 — 나머지 5종
 * (OBSTRUCTION/ILLEGAL_PARKING/BRAILLE_BLOCK_DAMAGE/SLIPPERY_SURFACE/OTHER)은 아직
 * Figma 마커 아트가 없어 `issueTypeMarkerIcon()`이 undefined를 반환하고, 호출부는
 * 기본 원형 마커로 폴백한다(obstacleSeverityStyle.ts의 ISSUE_TYPE_LABEL 주석 참고).
 *
 * 배경은 진짜 반투명(알파 채널 그대로)이라 지도 위에서 실제로 비쳐 보인다 — Figma 목업의
 * 회색으로 보이는 배경은 어두운 아트보드 캔버스에 반투명 흰색이 겹쳐 보인 것일 뿐이다.
 * 건수 구간별(10건 이상=주황/미만=초록)로 테두리·아이콘 색이 다른 에셋을 둔다. 크기도
 * 구간별로 다른데(90px/70px), NaverMapMarkerOverlay가 로컬 리소스 이미지 마커에서
 * width/height prop을 무시하고 원본 해상도로 그릴 가능성에 대비해 PNG 자체의 해상도도
 * 티어별로 다르게 굽는다 — width/height prop 분기(issueTypeMarkerSize 사용처,
 * MapHomeScreen.tsx)만으로는 부족할 수 있다.
 */
const ISSUE_TYPE_MARKER_ICON: Partial<Record<ObstacleIssueType, { high: ImageRequireSource; low: ImageRequireSource }>> = {
  CONSTRUCTION: {
    high: require("@/assets/icons/markers/construction_high.png"),
    low: require("@/assets/icons/markers/construction_low.png")
  },
  HIGH_CURB: {
    high: require("@/assets/icons/markers/high_curb_high.png"),
    low: require("@/assets/icons/markers/high_curb_low.png")
  },
  LONG_WALKING_DISTANCE: {
    high: require("@/assets/icons/markers/long_walking_distance_high.png"),
    low: require("@/assets/icons/markers/long_walking_distance_low.png")
  },
  NARROW_PASSAGE: {
    high: require("@/assets/icons/markers/narrow_passage_high.png"),
    low: require("@/assets/icons/markers/narrow_passage_low.png")
  },
  SIDEWALK_DAMAGE: {
    high: require("@/assets/icons/markers/sidewalk_damage_high.png"),
    low: require("@/assets/icons/markers/sidewalk_damage_low.png")
  },
  STAIRS: {
    high: require("@/assets/icons/markers/stairs_high.png"),
    low: require("@/assets/icons/markers/stairs_low.png")
  },
  STEEP_SLOPE: {
    high: require("@/assets/icons/markers/steep_slope_high.png"),
    low: require("@/assets/icons/markers/steep_slope_low.png")
  }
};

// 위 마커 PNG와 같은 7종만. <Icon>도 이 7종 외에는 그릴 아트가 없어 name prop이
// IconName으로 좁혀져야 하므로, ISSUE_TYPE_LABEL(문자열 12종)과 별도로 이 맵을 둔다.
const ISSUE_TYPE_ICON_NAME: Partial<Record<ObstacleIssueType, IconName>> = {
  CONSTRUCTION: "공사구간",
  HIGH_CURB: "높은턱",
  LONG_WALKING_DISTANCE: "긴보행거리",
  NARROW_PASSAGE: "좁은통로",
  SIDEWALK_DAMAGE: "보도파손",
  STAIRS: "계단",
  STEEP_SLOPE: "급경사"
};

export function issueTypeIconName(issueType: ObstacleIssueType): IconName | undefined {
  return ISSUE_TYPE_ICON_NAME[issueType];
}

const ISSUE_TYPE_MARKER_COLOR_TIERS = [{ min: ISSUE_TYPE_MARKER_COUNT_THRESHOLD, value: "high" as const }];

export function issueTypeMarkerColorTier(reportCount: number): "high" | "low" {
  return tieredValue(reportCount, ISSUE_TYPE_MARKER_COLOR_TIERS, "low");
}

export function issueTypeMarkerIcon(issueType: ObstacleIssueType, reportCount: number): ImageRequireSource | undefined {
  return ISSUE_TYPE_MARKER_ICON[issueType]?.[issueTypeMarkerColorTier(reportCount)];
}

export function issueTypeMarkerCaptionColor(reportCount: number): string {
  return ISSUE_TYPE_MARKER_COLOR[issueTypeMarkerColorTier(reportCount)];
}

/**
 * Figma "중간 줌" 스펙: 10건 이상=90px, 미만=70px. issueTypeMarkerCaptionColor()와 동일하게
 * issueTypeMarkerColorTier()로 구간을 나누고 obstacleSeverityStyle.ts의 ISSUE_TYPE_MARKER_SIZE에서
 * 값을 읽어온다 — 색상·크기가 항상 같은 tier 판정 함수 하나를 공유해 서로 어긋날 수 없다.
 */
export function issueTypeMarkerSize(reportCount: number): number {
  return ISSUE_TYPE_MARKER_SIZE[issueTypeMarkerColorTier(reportCount)];
}

/** 건수 텍스트 — 두 단계 모두 동일 크기로 고정. */
export const ISSUE_TYPE_MARKER_CAPTION_SIZE = 18;

/**
 * 네이티브 caption은 항상 마커 "바운딩 박스"의 정중앙에만 렌더링된다(offset을 주면 렌더링
 * 자체가 사라지는 버그가 있어 못 씀). 그래서 마커 이미지 자체를 오른쪽으로 넓혀서(원 위치는
 * 그대로 둠) 바운딩 박스 중앙(=caption/숫자 위치)이 원의 진짜 중심보다 오른쪽에 오게
 * 만든다 — 왼쪽에 고정 배치한 아이콘과 간격이 벌어져 겹치지 않는다. width/anchor.x를 이
 * 값과 반드시 함께 맞춰야 한다.
 */
export const ISSUE_TYPE_MARKER_WIDTH_RATIO = 1.2933;
export const ISSUE_TYPE_MARKER_ANCHOR_X = 0.3866;

/**
 * 세로 방향도 정확히 같은 트릭 — 라벨 텍스트 + 줄간격 + 아이콘/숫자 줄을 한 블록으로 보고
 * 원의 세로 중앙 기준 대칭 배치하면, 그 블록(특히 숫자가 놓이는 아이콘 줄)이 원의 진짜
 * 세로 중심보다 아래로 내려간다. 네이티브 caption은 세로도 바운딩 박스 정중앙에만 렌더링되므로,
 * 마커 이미지 캔버스 "아래쪽"에만 여백을 더해 바운딩 박스 세로 중앙을 그 위치까지 밀어야
 * 숫자와 아이콘이 같은 줄에서 어긋나지 않는다.
 */
export const ISSUE_TYPE_MARKER_HEIGHT_RATIO = 1.12;
export const ISSUE_TYPE_MARKER_ANCHOR_Y = 0.4464;
