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
 * `ObstacleIssueType` 7종(BE enum과 1:1) 전부 여기 키로 있다 — 예전엔 BE에 없는 5종
 * (적치물/불법주차/점자블록훼손/미끄러운길/기타)도 타입에 남아 있어 `issueTypeMarkerIcon()`이
 * undefined를 반환할 수 있었지만, 그 5종은 실제 제보 데이터에 나타난 적이 없어 타입에서
 * 통째로 지웠다(obstacleReportApi.ts 주석 참고) — 그래서 지금은 이 함수가 항상 값을 반환한다.
 *
 * 배경은 진짜 반투명(알파 채널 그대로)이라 지도 위에서 실제로 비쳐 보인다 — Figma 목업의
 * 회색으로 보이는 배경은 어두운 아트보드 캔버스에 반투명 흰색이 겹쳐 보인 것일 뿐이다.
 * 건수 구간별(10건 이상=주황/미만=초록)로 테두리·아이콘 색이 다른 에셋을 둔다. 크기도
 * 구간별로 다른데(90px/70px), NaverMapMarkerOverlay가 로컬 리소스 이미지 마커에서
 * width/height prop을 무시하고 원본 해상도로 그릴 가능성에 대비해 PNG 자체의 해상도도
 * 티어별로 다르게 굽는다 — width/height prop 분기(issueTypeMarkerSize 사용처,
 * MapHomeScreen.tsx)만으로는 부족할 수 있다.
 */
const ISSUE_TYPE_MARKER_ICON: Record<ObstacleIssueType, { high: ImageRequireSource; low: ImageRequireSource }> = {
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

// ObstacleIssueType 7종 전부. <Icon>의 name prop이 IconName으로 좁혀져야 하므로,
// ISSUE_TYPE_LABEL(obstacleSeverityStyle.ts)과 별도로 이 맵을 둔다.
const ISSUE_TYPE_ICON_NAME: Record<ObstacleIssueType, IconName> = {
  CONSTRUCTION: "공사구간",
  HIGH_CURB: "높은턱",
  LONG_WALKING_DISTANCE: "긴보행거리",
  NARROW_PASSAGE: "좁은통로",
  SIDEWALK_DAMAGE: "보도파손",
  STAIRS: "계단",
  STEEP_SLOPE: "급경사"
};

export function issueTypeIconName(issueType: ObstacleIssueType): IconName {
  return ISSUE_TYPE_ICON_NAME[issueType];
}

/**
 * 가까운 줌 마커용: pin 모양(흰 몸통 + 주황 테두리·아이콘) 정적 이미지. 가까운 줌은
 * 언클러스터링이라 건수 구간이 없고(리포트 1건 = 마커 1개), 그래서 색도 항상 이 한 가지
 * (테두리·아이콘 #ED782F, 몸통 #FFFFFF)뿐이다 — 위 원형 배지처럼 high/low 두 변형을 두지
 * 않는다. `scripts/gen_marker_icons.py`가 굽는 `pin_<key>.png`와 1:1로 대응. ObstacleIssueType
 * 7종 전부 전용 아트가 있다.
 */
const ISSUE_TYPE_PIN_ICON: Record<ObstacleIssueType, ImageRequireSource> = {
  CONSTRUCTION: require("@/assets/icons/markers/pin_construction.png"),
  HIGH_CURB: require("@/assets/icons/markers/pin_high_curb.png"),
  LONG_WALKING_DISTANCE: require("@/assets/icons/markers/pin_long_walking_distance.png"),
  NARROW_PASSAGE: require("@/assets/icons/markers/pin_narrow_passage.png"),
  SIDEWALK_DAMAGE: require("@/assets/icons/markers/pin_sidewalk_damage.png"),
  STAIRS: require("@/assets/icons/markers/pin_stairs.png"),
  STEEP_SLOPE: require("@/assets/icons/markers/pin_steep_slope.png")
};

export function issueTypePinIcon(issueType: ObstacleIssueType): ImageRequireSource {
  return ISSUE_TYPE_PIN_ICON[issueType];
}

/**
 * pin PNG 원본 비율(240x276)을 그대로 유지하는 표시 크기. anchor는 이미지 하단 중앙(pin의
 * 뾰족한 끝)이 좌표를 정확히 가리키게 (0.5, 1) — SearchPlaceMarker와 같은 관례.
 */
export const ISSUE_TYPE_PIN_WIDTH = 44;
export const ISSUE_TYPE_PIN_HEIGHT = 50;
export const ISSUE_TYPE_PIN_ANCHOR = { x: 0.5, y: 1 } as const;

/**
 * pin 위에 얹는 이슈유형 이름표(네이티브 caption) 색. 기획엔 흰 글자 + 주황 외곽선으로
 * 지도 배경 위에서도 읽히게 돼 있다 — 이 주황은 pin 테두리/아이콘과 같은
 * ISSUE_TYPE_MARKER_COLOR.high 값이라 여기서 새로 정의하지 않고 그대로 재사용한다.
 */
export const ISSUE_TYPE_PIN_LABEL_HALO_COLOR = ISSUE_TYPE_MARKER_COLOR.high;
export const ISSUE_TYPE_PIN_LABEL_TEXT_SIZE = 12;

const ISSUE_TYPE_MARKER_COLOR_TIERS = [{ min: ISSUE_TYPE_MARKER_COUNT_THRESHOLD, value: "high" as const }];

export function issueTypeMarkerColorTier(reportCount: number): "high" | "low" {
  return tieredValue(reportCount, ISSUE_TYPE_MARKER_COLOR_TIERS, "low");
}

export function issueTypeMarkerIcon(issueType: ObstacleIssueType, reportCount: number): ImageRequireSource {
  return ISSUE_TYPE_MARKER_ICON[issueType][issueTypeMarkerColorTier(reportCount)];
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
