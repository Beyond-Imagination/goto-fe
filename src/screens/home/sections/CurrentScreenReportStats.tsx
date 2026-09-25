import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Card, Text as AppText } from "@/components";
import { InfoMark } from "@/components/help";
import { Icon, type IconName } from "@/components/icons/Icon";
import { colors } from "@/styles/tokens/colors";
import { radius } from "@/styles/tokens/radius";
import { spacing } from "@/styles/tokens/spacing";

/** 카테고리 한 건의 제보 통계. count 합이 totalCount와 항상 같다고 가정하지 않는다 —
 * 화면에 보이는 카테고리 밖의 제보가 있을 수 있다. */
export type ReportCategoryStat = {
  readonly categoryId: string;
  readonly label: string;
  readonly subDescription: string;
  readonly count: number;
  readonly percentage: number; // 0~100, 반올림된 정수
  // "#RRGGBB" — 도넛/범례에 그대로 쓰는 색(선택되면 SELECTED_COLOR로 덮어써 무시된다).
  // 카테고리 고유색이 아니라 배열 순위별 그라데이션 값을 넣는다 — reportStatsGradientColor() 참고.
  readonly color: string;
  readonly iconType: IconName; // 지도 마커(issueTypeMarkerIcons.ts)와 같은 아이콘 매핑 키
};

export type CurrentScreenReportStats = {
  readonly totalCount: number;
  readonly descriptionText: string;
  readonly categories: readonly ReportCategoryStat[];
};

const DEFAULT_COLLAPSED_COUNT = 4;

// 리스트 행 선택 상태 색 — 카테고리별 color와 무관하게 항상 이 둘뿐(파랑/회색)이다.
// colors.brand.reportStat은 Figma 실측값(총 건수 숫자·선택된 카테고리 색과 동일)이다.
const SELECTED_COLOR = colors.brand.reportStat;
const UNSELECTED_ICON_COLOR = colors.neutral[500];
const UNSELECTED_ICON_BOX_BG = colors.neutral[100];

// Figma 실측: 도넛/범례 색은 카테고리마다 다른 색(무지개)이 아니라, SELECTED_COLOR 위에
// 흰색을 섞어 순위가 내려갈수록 옅어지는 파랑→회색 그라데이션 하나뿐이다 — 1위 100%,
// 2위 50%, 3위 20%, 4위 10% (R채널 역산으로 확인한 정확한 비율). 5위 이후는 실측 대상이
// 없어 같은 "대략 반씩 옅어짐" 패턴을 이어가다 5%에서 더 안 옅어지게 바닥을 둔다.
const RANK_GRADIENT_OPACITIES = [1, 0.5, 0.2, 0.1];
const RANK_GRADIENT_MIN_OPACITY = 0.05;

/** categories 배열에서 이 카테고리의 순위(0-based, 건수 내림차순 정렬 기준)로 도넛/범례
 * 색을 계산한다. 카테고리 정체성(ObstacleIssueType)과는 무관 — 같은 카테고리도 정렬 순서가
 * 바뀌면 다른 색이 된다. */
export function reportStatsGradientColor(rank: number): string {
  const opacity = RANK_GRADIENT_OPACITIES[rank] ?? RANK_GRADIENT_MIN_OPACITY;
  return tintOnWhite(SELECTED_COLOR, opacity);
}

type CurrentScreenReportStatsCardProps = CurrentScreenReportStats & {
  /** 접힌 상태에서 보여줄 카테고리 개수. @default 4 */
  readonly collapsedCount?: number;
};

export function CurrentScreenReportStatsCard({
  totalCount,
  descriptionText,
  categories,
  collapsedCount = DEFAULT_COLLAPSED_COUNT
}: CurrentScreenReportStatsCardProps) {
  const [expanded, setExpanded] = useState(false);
  // 기본값은 첫 번째 카테고리. categories가 바뀌어 이 id가 더는 없으면(필터링 등)
  // 아래 selectedCategory 계산에서 자동으로 첫 번째로 폴백한다 — 별도 동기화 useEffect 불필요.
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.categoryId ?? null);

  if (categories.length === 0) {
    return (
      <Card elevation="sm">
        <TitleRow />
        <AppText color={colors.text.secondary} style={styles.emptyText} variant="body-3">
          확인된 접근성 제보가 없습니다
        </AppText>
      </Card>
    );
  }

  const selectedCategory = categories.find((category) => category.categoryId === selectedCategoryId) ?? categories[0]!;
  const canToggle = categories.length > collapsedCount;
  const visibleCategories = expanded ? categories : categories.slice(0, collapsedCount);
  const listContent = (
    <View style={styles.list}>
      {visibleCategories.map((category) => (
        <CategoryRow
          category={category}
          isSelected={category.categoryId === selectedCategory.categoryId}
          key={category.categoryId}
          onPress={() => {
            setSelectedCategoryId(category.categoryId);
          }}
        />
      ))}
    </View>
  );

  return (
    <Card elevation="sm">
      <TitleRow />

      <View style={styles.summaryRow}>
        <View style={styles.summaryTextGroup}>
          <AppText color={SELECTED_COLOR} variant="headline-1" weight="bold">
            {totalCount}
            <AppText color={SELECTED_COLOR} variant="caption-1" weight="regular">
              건
            </AppText>
          </AppText>
          <AppText color={colors.text.secondary} style={styles.descriptionText} variant="body-3">
            {descriptionText}
          </AppText>
        </View>
        <ReportStatsDonut categories={categories} selectedCategory={selectedCategory} />
      </View>

      {listContent}

      {canToggle ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            setExpanded((prev) => !prev);
          }}
          style={styles.toggleBox}
        >
          <AppText color={colors.text.secondary} variant="body-3" weight="semibold">
            {expanded ? "정보 접기" : "정보 더보기"}
          </AppText>
          <AppText color={colors.text.secondary} variant="body-3">
            {expanded ? "∧" : "∨"}
          </AppText>
        </Pressable>
      ) : null}
    </Card>
  );
}

function TitleRow() {
  return (
    <View style={styles.titleRow}>
      <AppText style={styles.titleText} variant="title-2" weight="semibold">
        현재 화면 제보
      </AppText>
      {/* 지금은 정적 배지만 — 탭해서 툴팁/설명을 띄우는 인터랙션은 별도 확인 후 붙인다. */}
      <InfoMark />
    </View>
  );
}

const DONUT_SIZE = 96;
const DONUT_STROKE_WIDTH = 16;
// 선택된 세그먼트는 색만으로 구분되지 않는다 — 1위 카테고리는 원래 등수 색 자체가
// SELECTED_COLOR와 똑같아서(그라데이션 100%), 선택 안 했을 때도 항상 진한 파랑으로
// 보여 "선택돼서 진한 건지 그냥 1위라 진한 건지" 헷갈린다. 그래서 선택된 세그먼트만
// 링을 더 두껍게 그려 등수/색과 무관하게 항상 튀어나와 보이게 한다.
const SELECTED_DONUT_STROKE_WIDTH = DONUT_STROKE_WIDTH + 5;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE_WIDTH) / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
// 실제로 그리는 캔버스(Svg·컨테이너 크기)는 링 지름(DONUT_SIZE, 반지름 계산 기준값 — 이건
// 안 바꿈)보다 살짝 더 크게 둔다 — 안 그러면 선택된 세그먼트의 두꺼워진 바깥쪽 테두리가
// 캔버스 경계에서 잘린다.
const DONUT_CANVAS_SIZE = DONUT_SIZE + (SELECTED_DONUT_STROKE_WIDTH - DONUT_STROKE_WIDTH);
// 세그먼트 색은 선택 여부와 무관하게 항상 category.color(순위별 그라데이션, 위
// SELECTED_DONUT_STROKE_WIDTH 주석 참고) 그대로 — 선택 표시는 색이 아니라 링 두께만으로
// 한다. 아이콘도 마찬가지로 세그먼트 색과 무관하게 항상 SELECTED_COLOR를 중간 톤으로
// 섞은 고정 색을 써서, 옅은 세그먼트 위에서도 아이콘이 묻히지 않게 한다.
const SEGMENT_ICON_TINT_OPACITY = 0.6;
const SEGMENT_ICON_SIZE = 10;

type DonutSegment = {
  readonly categoryId: string;
  readonly color: string;
  readonly isSelected: boolean;
  readonly length: number;
  readonly offset: number;
};

/**
 * percentage(반올림된 정수)의 합이 100을 넘거나 못 채우는 경우가 실제로 있을 수 있다고
 * 명시됐다 — 세그먼트 길이를 각자 percentage로 독립적으로 그리면 원 둘레에 빈 틈이 생기거나
 * 겹친다. 그래서 앞쪽 세그먼트는 각자 percentage대로 그리되(단, 남은 둘레를 넘지 않게
 * 클램프), 마지막 세그먼트만 "남은 둘레 전부"로 강제해 항상 정확히 한 바퀴(360도)로
 * 닫히게 만든다.
 */
function buildDonutSegments(categories: readonly ReportCategoryStat[], selectedCategoryId: string): DonutSegment[] {
  let offset = 0;
  return categories.map((category, index) => {
    const remaining = Math.max(DONUT_CIRCUMFERENCE - offset, 0);
    const isLast = index === categories.length - 1;
    const clampedPercentage = Math.min(Math.max(category.percentage, 0), 100);
    const rawLength = (clampedPercentage / 100) * DONUT_CIRCUMFERENCE;
    const length = isLast ? remaining : Math.min(rawLength, remaining);
    const isSelected = category.categoryId === selectedCategoryId;

    const segment: DonutSegment = { categoryId: category.categoryId, color: category.color, isSelected, length, offset };
    offset += length;
    return segment;
  });
}

/** 도넛 세그먼트 원호의 중간 지점(링 중심선 위) 좌표 — 세그먼트 안에 아이콘을 얹을 때 쓴다.
 * strokeDashoffset=-offset + rotate(-90)으로 그리는 세그먼트와 같은 좌표계라야 한다:
 * arc length 0은 12시 방향이고, length가 늘수록 시계 방향으로 돈다. */
function donutSegmentMidpoint(segment: DonutSegment): { x: number; y: number } {
  const center = DONUT_CANVAS_SIZE / 2;
  const midLength = segment.offset + segment.length / 2;
  const angleDeg = -90 + (midLength / DONUT_CIRCUMFERENCE) * 360;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: center + DONUT_RADIUS * Math.cos(angleRad),
    y: center + DONUT_RADIUS * Math.sin(angleRad)
  };
}

function ReportStatsDonut({
  categories,
  selectedCategory
}: {
  readonly categories: readonly ReportCategoryStat[];
  readonly selectedCategory: ReportCategoryStat;
}) {
  const segments = buildDonutSegments(categories, selectedCategory.categoryId);
  const center = DONUT_CANVAS_SIZE / 2;

  return (
    <View style={styles.donutRow}>
      <View style={styles.donutStack}>
        <Svg height={DONUT_CANVAS_SIZE} width={DONUT_CANVAS_SIZE}>
          <Circle cx={center} cy={center} fill="none" r={DONUT_RADIUS} stroke={colors.neutral[100]} strokeWidth={DONUT_STROKE_WIDTH} />
          {segments
            .filter((segment) => segment.length > 0)
            .map((segment) => (
              <Circle
                cx={center}
                cy={center}
                fill="none"
                key={segment.categoryId}
                r={DONUT_RADIUS}
                stroke={segment.color}
                strokeDasharray={`${segment.length} ${Math.max(DONUT_CIRCUMFERENCE - segment.length, 0)}`}
                strokeDashoffset={-segment.offset}
                strokeWidth={segment.isSelected ? SELECTED_DONUT_STROKE_WIDTH : DONUT_STROKE_WIDTH}
                transform={`rotate(-90 ${center} ${center})`}
              />
            ))}
        </Svg>
        {segments
          .filter((segment) => segment.length > 0)
          .map((segment) => {
            const category = categories.find((candidate) => candidate.categoryId === segment.categoryId);
            if (!category) {
              return null;
            }
            // 아이콘 색은 선택 여부가 아니라 그 세그먼트 배경(category.color)이 어두운지로
            // 정한다 — 1위처럼 진한 배경엔 흰색이 대비가 나고, 순위가 낮아 옅은 배경엔
            // SELECTED_COLOR를 중간 톤으로 섞은 고정 색이 대비가 난다. 선택돼도 세그먼트
            // 색 자체는 안 바뀌므로(위 주석 참고) 이 판단도 선택과 무관하게 항상 같다.
            const iconColor = isDarkColor(category.color) ? colors.text.inverse : tintOnWhite(SELECTED_COLOR, SEGMENT_ICON_TINT_OPACITY);
            const { x, y } = donutSegmentMidpoint(segment);
            return (
              <View
                key={`icon-${segment.categoryId}`}
                pointerEvents="none"
                style={[styles.segmentIcon, { left: x - SEGMENT_ICON_SIZE / 2, top: y - SEGMENT_ICON_SIZE / 2 }]}
              >
                <Icon color={iconColor} name={category.iconType} size={SEGMENT_ICON_SIZE} />
              </View>
            );
          })}
      </View>
      <View style={styles.legend}>
        {categories.map((category, index) => (
          <View key={category.categoryId} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: category.color }]} />
            <AppText color={colors.text.secondary} numberOfLines={1} style={styles.legendText} variant="caption-2">
              {index + 1}. {category.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function CategoryRow({
  category,
  isSelected,
  onPress
}: {
  readonly category: ReportCategoryStat;
  readonly isSelected: boolean;
  readonly onPress: () => void;
}) {
  const iconColor = isSelected ? SELECTED_COLOR : UNSELECTED_ICON_COLOR;
  const iconBoxBg = isSelected ? SELECTED_ICON_BOX_BG : UNSELECTED_ICON_BOX_BG;
  const countColor = isSelected ? SELECTED_COLOR : colors.text.secondary;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card elevation="sm" padding={3}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
            <Icon color={iconColor} name={category.iconType} size={18} />
          </View>
          <View style={styles.rowTextGroup}>
            <AppText numberOfLines={1} variant="body-2" weight="semibold">
              {category.label}
            </AppText>
            <AppText color={colors.text.secondary} numberOfLines={1} variant="caption-1">
              {category.subDescription}
            </AppText>
          </View>
          <View style={styles.rowStats}>
            <AppText color={countColor} variant="body-2" weight="semibold">
              {category.count}건
            </AppText>
            <AppText color={colors.text.secondary} variant="body-2" weight="semibold">
              {category.percentage}%
            </AppText>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

/** SELECTED_COLOR를 흰 배경과 섞은 옅은 배경색(선택된 행의 아이콘 박스 배경). */
function tintOnWhite(hex: string, opacity: number): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) {
    return colors.neutral[100];
  }
  const [r, g, b] = [0, 2, 4].map((start) => parseInt(match[1]!.slice(start, start + 2), 16));
  const mix = (channel: number) => Math.round(channel * opacity + 255 * (1 - opacity));
  return `rgb(${mix(r!)}, ${mix(g!)}, ${mix(b!)})`;
}

const SELECTED_ICON_BOX_BG = tintOnWhite(SELECTED_COLOR, 0.12);

/** 도넛 세그먼트 아이콘 색을 고를 때 그 세그먼트 배경이 흰 아이콘을 받쳐줄 만큼 어두운지
 * 판단한다(지각 휘도 기준). 예상 못 한 포맷이면 밝은 배경으로 취급해 옅은 아이콘을 쓴다. */
function isDarkColor(hex: string): boolean {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) {
    return false;
  }
  const [r, g, b] = [0, 2, 4].map((start) => parseInt(match[1]!.slice(start, start + 2), 16));
  const luminance = (0.299 * r! + 0.587 * g! + 0.114 * b!) / 255;
  return luminance < 0.5;
}

const styles = StyleSheet.create({
  descriptionText: {
    marginTop: spacing[1]
  },
  donutRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2]
  },
  donutStack: {
    alignItems: "center",
    height: DONUT_CANVAS_SIZE,
    justifyContent: "center",
    width: DONUT_CANVAS_SIZE
  },
  emptyText: {
    marginTop: spacing[2]
  },
  iconBox: {
    alignItems: "center",
    borderRadius: radius.md,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  legend: {
    gap: spacing[1]
  },
  legendDot: {
    borderRadius: radius.full,
    height: 8,
    width: 8
  },
  legendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1]
  },
  legendText: {
    maxWidth: 96
  },
  list: {
    gap: spacing[2]
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2]
  },
  rowStats: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing[2]
  },
  rowTextGroup: {
    flex: 1,
    gap: spacing[0.5]
  },
  segmentIcon: {
    position: "absolute"
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing[3]
  },
  summaryTextGroup: {
    flex: 1
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  titleText: {
    marginRight: spacing[1]
  },
  toggleBox: {
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    flexDirection: "row",
    gap: spacing[1],
    justifyContent: "center",
    marginTop: spacing[3],
    paddingVertical: spacing[2]
  }
});
