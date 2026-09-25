import { View } from "react-native";

import { Text as AppText } from "@/components";
import type { ObstacleIssueType, ObstacleReportCluster } from "@/obstacleReportApi";
import type { PlaceSearchItem } from "@/placeApi";
import type { RecentlyViewedPlace } from "@/state/recentlyViewedPlaces";
import { colors } from "@/styles/tokens/colors";

import { homeSectionStyles } from "../homeSectionStyles";
import { issueTypeIconName } from "../issueTypeMarkerIcons";
import {
  clusterDominantIssueType,
  ISSUE_TYPE_LABEL,
  ISSUE_TYPE_STAT_SUB_DESCRIPTION,
  isKnownIssueType,
  issueTypeStatCategoryId
} from "../obstacleSeverityStyle";
import {
  CurrentScreenReportStatsCard,
  reportStatsGradientColor,
  type ReportCategoryStat
} from "../sections/CurrentScreenReportStats";
import { RecentlyViewedPlacesSection } from "../sections/RecentlyViewedPlacesSection";
import { RecentReportsList, type RecentReportItem } from "../sections/RecentReportsList";
import { RecommendedPlacesSection } from "../sections/RecommendedPlacesSection";

type CloseZoomContentProps = {
  readonly clusters: readonly ObstacleReportCluster[];
  readonly nickname: string | undefined;
  readonly onPlacePress: (place: PlaceSearchItem) => void;
  readonly recentlyViewedPlaces: readonly RecentlyViewedPlace[];
  readonly recommendedPlaces: readonly PlaceSearchItem[];
};

// 뷰포트 안 제보를 전부 그리면 Image가 그만큼 동시에 로드된다 — 최근 순으로 이 개수까지만.
const RECENT_REPORTS_MAX_COUNT = 20;

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
      // FE가 모르는 이슈유형은 아이콘·라벨이 없어 통계에서 제외한다(총 건수도 같이 빠진다).
      if (!isKnownIssueType(entry.issueType)) {
        continue;
      }
      issueTypeCounts.set(entry.issueType, (issueTypeCounts.get(entry.issueType) ?? 0) + entry.count);
      totalCount += entry.count;
    }
  }
  const breakdown = Array.from(issueTypeCounts.entries()).sort((a, b) => b[1] - a[1]);
  const categoryStats: ReportCategoryStat[] = breakdown.map(([issueType, count], index) => ({
    categoryId: issueTypeStatCategoryId(issueType),
    // 카테고리 고유색이 아니라 순위(건수 내림차순)별 파랑→회색 그라데이션 — 어떤 이슈유형이든
    // 1위면 진한 파랑, 뒤로 갈수록 옅어진다(reportStatsGradientColor 주석 참고).
    color: reportStatsGradientColor(index),
    count,
    iconType: issueTypeIconName(issueType),
    label: ISSUE_TYPE_LABEL[issueType],
    percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0,
    subDescription: ISSUE_TYPE_STAT_SUB_DESCRIPTION[issueType]
  }));

  // 대표 이슈유형이 없거나 FE가 모르는 값인 클러스터는 RecentReportItem의 iconType(필수)을
  // 채울 수 없어 제외한다 — 가까운 줌은 언클러스터링이라 정상 데이터라면 클러스터 하나 =
  // 제보 하나여서 항상 대표 이슈유형이 있어야 한다.
  const recentReportItems: RecentReportItem[] = clusters
    .filter((cluster) => cluster.id !== null)
    .sort((a, b) => new Date(b.latestReportAt).getTime() - new Date(a.latestReportAt).getTime())
    .flatMap((cluster) => {
      const dominantIssueType = clusterDominantIssueType(cluster);
      if (dominantIssueType === undefined) {
        return [];
      }
      return [
        {
          category: ISSUE_TYPE_LABEL[dominantIssueType],
          iconType: issueTypeIconName(dominantIssueType),
          locationText: cluster.nearbyPlaceLabel ?? "주변 장소 정보 없음",
          timeAgo: formatRelativeTime(cluster.latestReportAt),
          thumbnailUrl: cluster.photoUrls?.[0] ?? null
        }
      ];
    })
    .slice(0, RECENT_REPORTS_MAX_COUNT);

  return (
    <View style={homeSectionStyles.sections}>
      <CurrentScreenReportStatsCard
        categories={categoryStats}
        // 자동 줄바꿈에 맡기면 컨테이너 너비에 따라 끊기는 지점이 기획과 달라진다 — 줄바꿈
        // 위치를 명시적으로 고정한다.
        descriptionText={"이 지역에서 확인 된\n접근성 제보 수"}
        totalCount={totalCount}
      />

      <View style={homeSectionStyles.sections}>
        <AppText style={homeSectionStyles.sectionHeading} variant="title-2" weight="semibold">
          최근 제보
        </AppText>
        {recentReportItems.length === 0 ? (
          <AppText color={colors.text.secondary} variant="body-3">
            이 화면에 표시할 제보가 없어요.
          </AppText>
        ) : (
          <RecentReportsList items={recentReportItems} />
        )}
      </View>

      <RecommendedPlacesSection nickname={nickname} onPlacePress={onPlacePress} places={recommendedPlaces} />
      <RecentlyViewedPlacesSection places={recentlyViewedPlaces} />
    </View>
  );
}
