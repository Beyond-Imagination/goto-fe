import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { FilterChips } from '@/components/myinfo/FilterChips';
import { ListDivider } from '@/components/myinfo/ListDivider';
import { ListFooter } from '@/components/myinfo/ListFooter';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { NoticeCard } from '@/components/myinfo/NoticeCard';
import { ReportListItem } from '@/components/myinfo/ReportListItem';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import type { ObstacleReportStatus } from '@/myinfo';
import { toConfirmedListItem, useMyInfoApi, usePaginatedResource } from '@/myinfo';
import { colors } from '@/styles/tokens/colors';

const FILTERS = ['전체', '아직 있음', '해결 됨'] as const;

/** 필터 칩 → BE status 파라미터. 「전체」는 파라미터를 보내지 않습니다. */
const FILTER_STATUSES: Readonly<Record<Filter, ObstacleReportStatus | undefined>> = {
  전체: undefined,
  '아직 있음': 'ACTIVE',
  '해결 됨': 'RESOLVED',
};

/** 한 번에 불러오는 확인 기록 수. */
const PAGE_SIZE = 20;

/** 마지막 요소와 화면(홈 인디케이터) 사이 기본 여백. */
const CONTENT_BOTTOM_GAP = 24;

type Filter = (typeof FILTERS)[number];

type ConfirmedReportsScreenProps = {
  readonly onBack: () => void;
  /** 항목을 누르면 제보 상세로 이동합니다. */
  readonly onOpenReport: (reportId: string) => void;
};

/** 내 정보 05 — 내가 확인한 리포트. */
export function ConfirmedReportsScreen({ onBack, onOpenReport }: ConfirmedReportsScreenProps) {
  const insets = useSafeAreaInsets();
  const api = useMyInfoApi();
  const [filter, setFilter] = useState<Filter>('전체');

  // 상태 필터도 서버에서 걸러야 합니다. 페이지 단위로 받으므로 화면에서 걸러내면
  // "이 페이지에 우연히 없는 상태"가 빈 목록처럼 보입니다.
  const loadPage = useCallback(
    async (cursor: string | null) => {
      const page = await api.findMyConfirmedReportPage({
        status: FILTER_STATUSES[filter],
        cursor,
        size: PAGE_SIZE,
      });

      return { items: page.items.map(toConfirmedListItem), nextCursor: page.nextCursor };
    },
    [api, filter],
  );
  const confirmations = usePaginatedResource(loadPage, '확인 기록을 불러오지 못했어요. 다시 시도해주세요.');

  if (confirmations.state === 'loading') {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="내가 확인한 리포트" />
        <LoadingView message="확인 기록을 불러오는 중입니다..." />
      </SafeAreaView>
    );
  }

  if (confirmations.state === 'error') {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="내가 확인한 리포트" />
        <ErrorView
          message={confirmations.errorMessage ?? '확인 기록을 불러오지 못했어요.'}
          onRetry={confirmations.reload}
        />
      </SafeAreaView>
    );
  }

  const items = confirmations.items;
  // 지금까지 불러온 페이지 기준 요약입니다. 총 건수 API가 생기면 서버 값으로 바꿉니다.
  const locationCount = new Set(items.map(item => item.address)).size;

  return (
    // 배경은 화면 끝까지 채우고, 하단 안전 영역은 스크롤 패딩으로만 확보합니다.
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* 헤더는 스크롤과 무관하게 고정해 뒤로가기가 항상 보이게 합니다. */}
      <MyInfoHeader onBack={onBack} title="내가 확인한 리포트" />
      <FlatList
        ItemSeparatorComponent={ListDivider}
        ListFooterComponent={
          <>
            <ListFooter
              endMessage={items.length > 0 ? '마지막 페이지입니다.' : '이 분류의 확인 기록이 아직 없습니다.'}
              errorMessage={confirmations.loadMoreErrorMessage}
              hasNext={confirmations.hasNext}
              isLoadingMore={confirmations.isLoadingMore}
              onRetry={confirmations.loadMore}
            />
            <View style={styles.notice}>
              <NoticeCard
                body="같은 상태를 여러 사람이 확인하면 그 리포트의 신뢰도가 높아지고, 오래된 정보는 확인 필요로 내려갑니다."
                title="확인이 쌓이면 신뢰도가 올라갑니다"
              />
            </View>
          </>
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <FilterChips onSelect={setFilter} options={FILTERS} selected={filter} />
            <Text color={colors.text.tertiary} style={styles.summary} variant="body-3">
              {`${confirmations.hasNext ? `${items.length}건 이상` : `총 ${items.length}건`} · 최근 확인한 위치 ${locationCount}곳`}
            </Text>
          </View>
        }
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + CONTENT_BOTTOM_GAP }]}
        data={items}
        onEndReached={confirmations.loadMore}
        onEndReachedThreshold={0.4}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <ReportListItem onPress={() => onOpenReport(item.id)} report={item} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  listHeader: {
    marginBottom: 12,
    marginTop: 38,
  },
  summary: {
    marginTop: 18,
  },
  notice: {
    marginTop: 26,
  },
});
