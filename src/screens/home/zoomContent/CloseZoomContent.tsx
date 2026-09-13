import { StyleSheet, View } from "react-native";

import { Card, Text as AppText } from "@/components";
import type { ObstacleIssueType, ObstacleReportCluster } from "@/obstacleReportApi";
import type { PlaceSearchItem } from "@/placeApi";
import type { RecentlyViewedPlace } from "@/state/recentlyViewedPlaces";
import { colors } from "@/styles/tokens/colors";
import { spacing } from "@/styles/tokens/spacing";

import { homeSectionStyles } from "../homeSectionStyles";
import { clusterSeverityColor, clusterSeverityLabel, ISSUE_TYPE_LABEL } from "../obstacleSeverityStyle";
import { RecentlyViewedPlacesSection } from "../sections/RecentlyViewedPlacesSection";
import { RecommendedPlacesSection } from "../sections/RecommendedPlacesSection";

type CloseZoomContentProps = {
  readonly clusters: readonly ObstacleReportCluster[];
  readonly nickname: string | undefined;
  readonly onPlacePress: (place: PlaceSearchItem) => void;
  readonly recentlyViewedPlaces: readonly RecentlyViewedPlace[];
  readonly recommendedPlaces: readonly PlaceSearchItem[];
};

function formatRelativeTime(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) {
    return "방금 전";
  }
  if (diffMinutes < 60) {
    return `${String(diffMinutes)}분 전`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${String(diffHours)}시간 전`;
  }
  return `${String(Math.round(diffHours / 24))}일 전`;
}

export function CloseZoomContent({
  clusters,
  nickname,
  onPlacePress,
  recentlyViewedPlaces,
  recommendedPlaces
}: CloseZoomContentProps) {
  // 가까운 줌은 언클러스터링 상태라 클러스터 하나 = 제보 하나. topIssueTypes를 합산하면
  // 뷰포트 전체의 유형별 분포가 정확히 나온다(각 클러스터가 이미 리포트 1건이라 손실 없음).
  const issueTypeCounts = new Map<ObstacleIssueType, number>();
  let totalCount = 0;
  for (const cluster of clusters) {
    for (const entry of cluster.topIssueTypes) {
      issueTypeCounts.set(entry.issueType, (issueTypeCounts.get(entry.issueType) ?? 0) + entry.count);
      totalCount += entry.count;
    }
  }
  const breakdown = Array.from(issueTypeCounts.entries()).sort((a, b) => b[1] - a[1]);

  const reportItems = clusters
    .filter((cluster) => cluster.id !== null)
    .slice()
    .sort((a, b) => new Date(b.latestReportAt).getTime() - new Date(a.latestReportAt).getTime());

  return (
    <View style={homeSectionStyles.sections}>
      {totalCount > 0 ? (
        <Card elevation="sm">
          <AppText style={homeSectionStyles.sectionHeading} variant="title-2" weight="semibold">
            {totalCount}건 · 이 지역에서 확인된 접근성 제보 수
          </AppText>
          <View style={styles.breakdownList}>
            {breakdown.map(([issueType, count]) => (
              <View key={issueType} style={styles.breakdownRow}>
                <AppText style={styles.breakdownLabel} variant="body-3">
                  {ISSUE_TYPE_LABEL[issueType]}
                </AppText>
                <AppText color={colors.text.secondary} variant="body-3">
                  {count}건 · {Math.round((count / totalCount) * 100)}%
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <View style={homeSectionStyles.sections}>
        <AppText style={homeSectionStyles.sectionHeading} variant="title-2" weight="semibold">
          최근 제보
        </AppText>
        {reportItems.length === 0 ? (
          <AppText color={colors.text.secondary} variant="body-3">
            이 화면에 표시할 제보가 없어요.
          </AppText>
        ) : (
          reportItems.map((cluster) => (
            <Card elevation="sm" key={`report-${String(cluster.id)}`}>
              <View style={styles.issueRow}>
                <View style={[styles.severityDot, { backgroundColor: clusterSeverityColor(cluster) }]} />
                <View style={styles.issueTextGroup}>
                  <AppText variant="body-2" weight="semibold">
                    {cluster.topIssueTypes[0]
                      ? ISSUE_TYPE_LABEL[cluster.topIssueTypes[0].issueType]
                      : clusterSeverityLabel(cluster)}
                  </AppText>
                  <AppText color={colors.text.secondary} variant="caption-1">
                    {cluster.nearbyPlaceLabel ?? "주변 장소 정보 없음"} · {formatRelativeTime(cluster.latestReportAt)}
                  </AppText>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      <RecommendedPlacesSection nickname={nickname} onPlacePress={onPlacePress} places={recommendedPlaces} />
      <RecentlyViewedPlacesSection places={recentlyViewedPlaces} />
    </View>
  );
}

const styles = StyleSheet.create({
  breakdownLabel: {
    flex: 1
  },
  breakdownList: {
    gap: spacing[2],
    marginTop: spacing[3]
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  issueRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3]
  },
  issueTextGroup: {
    flex: 1,
    gap: spacing[1]
  },
  severityDot: {
    borderRadius: 6,
    height: 12,
    width: 12
  }
});
