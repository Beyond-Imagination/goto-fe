import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from "react-native";

import { Card, Icon, Text as AppText } from "@/components";
import type { ObstacleReportCluster } from "@/obstacleReportApi";
import type { PlaceSearchItem } from "@/placeApi";
import type { RecentlyViewedPlace } from "@/state/recentlyViewedPlaces";
import { colors } from "@/styles/tokens/colors";
import { radius } from "@/styles/tokens/radius";
import { spacing } from "@/styles/tokens/spacing";

import { homeSectionStyles } from "../homeSectionStyles";
import { issueTypeIconName } from "../issueTypeMarkerIcons";
import { ISSUE_TYPE_LABEL, issueTypeMarkerColor } from "../obstacleSeverityStyle";
import { RecentlyViewedPlacesSection } from "../sections/RecentlyViewedPlacesSection";
import { RecommendedPlacesSection } from "../sections/RecommendedPlacesSection";

type MidZoomContentProps = {
  readonly clusters: readonly ObstacleReportCluster[];
  readonly nickname: string | undefined;
  readonly onPlacePress: (place: PlaceSearchItem) => void;
  readonly recentlyViewedPlaces: readonly RecentlyViewedPlace[];
  readonly recommendedPlaces: readonly PlaceSearchItem[];
};

// 바텀시트 콘텐츠 좌우 패딩(bottomSheet.styles.ts의 content.paddingHorizontal)과 동일 —
// 카드 2장이 시트 폭에 꽉 차게 페이징되도록 캐러셀 폭 추정치를 여기서도 맞춰준다.
const SHEET_HORIZONTAL_PADDING = spacing[5];

export function MidZoomContent({
  clusters,
  nickname,
  onPlacePress,
  recentlyViewedPlaces,
  recommendedPlaces
}: MidZoomContentProps) {
  const labeledClusters = clusters.filter((cluster) => cluster.nearbyPlaceLabel !== null);
  const { width: windowWidth } = useWindowDimensions();
  const [issueScrollWidth, setIssueScrollWidth] = useState(windowWidth - SHEET_HORIZONTAL_PADDING * 2);
  const [issuePageIndex, setIssuePageIndex] = useState(0);
  const issuePageCount = Math.ceil(labeledClusters.length / 2);
  const issueCardWidth = (issueScrollWidth - spacing[3]) / 2;

  const handleIssueScrollLayout = useCallback((event: { nativeEvent: { layout: { width: number } } }) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0) {
      setIssueScrollWidth(nextWidth);
    }
  }, []);

  const handleIssueMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (issueScrollWidth > 0) {
        setIssuePageIndex(Math.round(event.nativeEvent.contentOffset.x / issueScrollWidth));
      }
    },
    [issueScrollWidth]
  );

  return (
    <View style={homeSectionStyles.sections}>
      {labeledClusters.length === 0 ? (
        <AppText color={colors.text.secondary} variant="body-3">
          이 주변에 표시할 접근성 이슈가 없어요.
        </AppText>
      ) : (
        <View>
          <ScrollView
            horizontal
            onLayout={handleIssueScrollLayout}
            onMomentumScrollEnd={handleIssueMomentumScrollEnd}
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {labeledClusters.map((cluster, index) => {
              const dominantIssueType = cluster.topIssueTypes[0]?.issueType;
              const color = issueTypeMarkerColor(cluster.reportCount);
              const iconName = dominantIssueType ? issueTypeIconName(dominantIssueType) : undefined;
              return (
                <Card
                  elevation="sm"
                  key={`${String(cluster.centerLat)}-${String(cluster.centerLng)}-${String(index)}`}
                  style={[
                    styles.issueCard,
                    { width: issueCardWidth },
                    index < labeledClusters.length - 1 ? styles.issueCardSpacing : null
                  ]}
                >
                  <View style={styles.issueCardHeader}>
                    {iconName ? <Icon color={color} name={iconName} size={22} /> : null}
                    <AppText color={color} variant="title-2" weight="bold">
                      {cluster.reportCount}
                      <AppText color={colors.text.secondary} variant="body-2" weight="regular">
                        건
                      </AppText>
                    </AppText>
                  </View>
                  {dominantIssueType ? (
                    <AppText color={color} variant="caption-1" weight="semibold">
                      {ISSUE_TYPE_LABEL[dominantIssueType]}
                    </AppText>
                  ) : null}
                  <AppText variant="body-3">{cluster.nearbyPlaceLabel}</AppText>
                </Card>
              );
            })}
          </ScrollView>
          {issuePageCount > 1 ? (
            <View style={styles.issueDots}>
              {Array.from({ length: issuePageCount }, (_, index) => (
                <View key={index} style={[styles.issueDot, index === issuePageIndex ? styles.issueDotActive : null]} />
              ))}
            </View>
          ) : null}
        </View>
      )}
      <RecommendedPlacesSection nickname={nickname} onPlacePress={onPlacePress} places={recommendedPlaces} />
      <RecentlyViewedPlacesSection places={recentlyViewedPlaces} />
    </View>
  );
}

const styles = StyleSheet.create({
  issueCard: {
    gap: spacing[1]
  },
  issueCardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1]
  },
  issueCardSpacing: {
    marginRight: spacing[3]
  },
  issueDot: {
    backgroundColor: colors.border.regular,
    borderRadius: radius.full,
    height: 6,
    width: 6
  },
  issueDotActive: {
    backgroundColor: colors.brand.main
  },
  issueDots: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[1],
    justifyContent: "center",
    marginTop: spacing[3]
  }
});
