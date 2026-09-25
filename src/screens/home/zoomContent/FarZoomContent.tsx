import { StyleSheet, View } from "react-native";

import { Card, Text as AppText } from "@/components";
import type { NearbyAccessibilitySummary, PlaceSearchItem } from "@/placeApi";
import type { RecentlyViewedPlace } from "@/state/recentlyViewedPlaces";
import { colors } from "@/styles/tokens/colors";
import { spacing } from "@/styles/tokens/spacing";

import { homeSectionStyles } from "../homeSectionStyles";
import {
  NEEDS_CONFIRMATION_COLOR,
  NEEDS_CONFIRMATION_LABEL,
  SEVERITY_COLOR,
  SEVERITY_LABEL
} from "../obstacleSeverityStyle";
import { RecentlyViewedPlacesSection } from "../sections/RecentlyViewedPlacesSection";
import { RecommendedPlacesSection } from "../sections/RecommendedPlacesSection";

type FarZoomContentProps = {
  readonly nearbySummary: NearbyAccessibilitySummary | null;
  readonly nickname: string | undefined;
  readonly onPlacePress: (place: PlaceSearchItem) => void;
  readonly recentlyViewedPlaces: readonly RecentlyViewedPlace[];
  readonly recommendedPlaces: readonly PlaceSearchItem[];
};

export function FarZoomContent({
  nearbySummary,
  nickname,
  onPlacePress,
  recentlyViewedPlaces,
  recommendedPlaces
}: FarZoomContentProps) {
  return (
    <View style={homeSectionStyles.sections}>
      {nearbySummary ? <AccessibilitySummaryCard summary={nearbySummary} /> : null}
      <RecommendedPlacesSection nickname={nickname} onPlacePress={onPlacePress} places={recommendedPlaces} />
      <RecentlyViewedPlacesSection places={recentlyViewedPlaces} />
    </View>
  );
}

function AccessibilitySummaryCard({ summary }: { readonly summary: NearbyAccessibilitySummary }) {
  return (
    <Card elevation="sm" style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <SummaryCount color={SEVERITY_COLOR.INFO} count={summary.safeCount} label={SEVERITY_LABEL.INFO} />
        <View style={styles.summaryDivider} />
        <SummaryCount color={SEVERITY_COLOR.CAUTION} count={summary.cautionCount} label={SEVERITY_LABEL.CAUTION} />
        <View style={styles.summaryDivider} />
        <SummaryCount
          color={SEVERITY_COLOR.IMPASSABLE}
          count={summary.detourRecommendedCount}
          label={SEVERITY_LABEL.IMPASSABLE}
        />
        <View style={styles.summaryDivider} />
        <SummaryCount
          color={NEEDS_CONFIRMATION_COLOR}
          count={summary.needsConfirmationCount}
          label={NEEDS_CONFIRMATION_LABEL}
        />
      </View>
    </Card>
  );
}

function SummaryCount({ color, count, label }: { readonly color: string; readonly count: number; readonly label: string }) {
  return (
    <View style={styles.summaryCount}>
      {/* 숫자를 크고 굵게, "건"은 작게 — 현재 화면 제보 통계 카드의 총 건수와 같은 비중이다. */}
      <AppText color={color} variant="headline-1" weight="bold">
        {String(count)}
        <AppText color={colors.text.secondary} variant="caption-1" weight="regular">
          건
        </AppText>
      </AppText>
      <AppText color={colors.text.secondary} variant="caption-1">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderWidth: 0,
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0
  },
  summaryCount: {
    alignItems: "center",
    gap: spacing[1]
  },
  summaryDivider: {
    alignSelf: "stretch",
    backgroundColor: colors.border.light,
    marginVertical: spacing[1],
    width: 1
  },
  // 항목을 균등 분배(flex: 1)하지 않고 고정 gap으로 모은 뒤, 묶음을 카드 안에서 가운데 정렬한다.
  summaryRow: {
    flexDirection: "row",
    gap: spacing[6],
    justifyContent: "center"
  }
});
