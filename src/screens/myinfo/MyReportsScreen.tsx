import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { FilterChips } from '@/components/myinfo/FilterChips';
import { ListDivider } from '@/components/myinfo/ListDivider';
import { ListFooter } from '@/components/myinfo/ListFooter';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { ReportListItem } from '@/components/myinfo/ReportListItem';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import type { ReportListItemData } from '@/components/myinfo/ReportListItem';
import type { MyReportKind } from '@/myinfo';
import { toReportListItem, useMyInfoApi, usePaginatedResource } from '@/myinfo';
import { colors } from '@/styles/tokens/colors';

const FILTERS = ['전체', '장애물', '장소', '시설'] as const;

/** 필터 칩 → BE kind 파라미터. 「전체」는 파라미터를 보내지 않습니다. */
const FILTER_KINDS: Readonly<Record<Filter, MyReportKind | undefined>> = {
  전체: undefined,
  장애물: 'OBSTACLE',
  장소: 'PLACE',
  시설: 'FACILITY',
};

/** 한 번에 불러오는 제보 수. */
const PAGE_SIZE = 20;

/** 마지막 요소와 화면(홈 인디케이터) 사이 기본 여백. */
const CONTENT_BOTTOM_GAP = 24;

type Filter = (typeof FILTERS)[number];

type MyReportsScreenProps = {
  readonly onBack: () => void;
  readonly onStartReport: () => void;
  readonly onOpenMap: () => void;
  /** 항목을 누르면 제보 상세로 이동합니다. */
  readonly onOpenReport: (item: ReportListItemData) => void;
  /** 데모용 — 빈 상태(내 정보 04) 프레임을 바로 확인하고 싶을 때 true. */
  readonly forceEmpty?: boolean;
};

/** 내 정보 03·04 — 내 제보 기록. 기록이 하나도 없으면 빈 상태 화면을 보여줍니다. */
export function MyReportsScreen({
  onBack,
  onStartReport,
  onOpenMap,
  onOpenReport,
  forceEmpty = false,
}: MyReportsScreenProps) {
  const insets = useSafeAreaInsets();
  const api = useMyInfoApi();
  const [filter, setFilter] = useState<Filter>('전체');

  // 분류 필터는 서버에서 걸러야 합니다. 페이지 단위로 받아오므로 화면에서 걸러내면
  // "이 페이지에 우연히 없는 분류"가 빈 목록처럼 보입니다.
  const loadPage = useCallback(
    async (cursor: string | null) => {
      const page = await api.findMyReportPage({
        kind: FILTER_KINDS[filter],
        cursor,
        size: PAGE_SIZE,
      });

      return { items: page.items.map(toReportListItem), nextCursor: page.nextCursor };
    },
    [api, filter],
  );
  const reports = usePaginatedResource(loadPage, '제보 기록을 불러오지 못했어요. 다시 시도해주세요.');

  if (reports.state === 'loading') {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="내 제보 기록" />
        <LoadingView message="제보 기록을 불러오는 중입니다..." />
      </SafeAreaView>
    );
  }

  if (reports.state === 'error') {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="내 제보 기록" />
        <ErrorView
          message={reports.errorMessage ?? '제보 기록을 불러오지 못했어요.'}
          onRetry={reports.reload}
        />
      </SafeAreaView>
    );
  }

  const items = forceEmpty ? [] : reports.items;

  // 첫 페이지가 비어 있고 더 불러올 것도 없으면 진짜 기록이 없는 경우입니다.
  if (items.length === 0 && filter === '전체' && !reports.hasNext) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="내 제보 기록" />
        <View style={[styles.empty, { paddingBottom: insets.bottom + 64 }]}>
          <Image source={require('../../assets/myinfo-report-empty.png')} style={styles.emptyIcon} />
          <Text
            color={colors.text.primary}
            style={styles.emptyTitle}
            variant="title-1"
            weight="semibold"
          >
            아직 제보한 기록이 없어요
          </Text>
          <Text color={colors.text.tertiary} style={styles.emptyBody} variant="body-1">
            {'다녀온 곳의 상태를 알려주면\n다음 사람의 이동 판단에 쓰입니다.'}
          </Text>
          <Pressable
            accessibilityLabel="첫 제보 시작하기"
            accessibilityRole="button"
            onPress={onStartReport}
            style={styles.emptyButton}
          >
            <Text color={colors.text.inverse} variant="body-1">
              첫 제보 시작하기
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    // 배경은 화면 끝까지 채우고, 하단 안전 영역은 스크롤 패딩으로만 확보합니다.
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* 헤더는 스크롤과 무관하게 고정해 뒤로가기가 항상 보이게 합니다. */}
      <MyInfoHeader onBack={onBack} title="내 제보 기록" />
      <FlatList
        ItemSeparatorComponent={ListDivider}
        ListFooterComponent={
          <ListFooter
            endMessage={items.length > 0 ? '마지막 페이지입니다.' : '이 분류의 제보가 아직 없습니다.'}
            errorMessage={reports.loadMoreErrorMessage}
            hasNext={reports.hasNext}
            isLoadingMore={reports.isLoadingMore}
            onRetry={reports.loadMore}
          />
        }
        ListHeaderComponent={
          <View style={styles.filters}>
            <FilterChips onSelect={setFilter} options={FILTERS} selected={filter} />
            <Pressable
              accessibilityLabel="제보 위치를 지도로 보기"
              accessibilityRole="button"
              onPress={onOpenMap}
              style={styles.mapLink}
            >
              <Text color={colors.brand.mainAlt} variant="body-3" weight="semibold">
                지도로 보기 ›
              </Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + CONTENT_BOTTOM_GAP }]}
        data={items}
        keyExtractor={item => `${item.kind}:${item.id}`}
        onEndReached={reports.loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <ReportListItem onPress={() => onOpenReport(item)} report={item} />
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
  filters: {
    gap: 12,
    marginBottom: 18,
    marginTop: 38,
  },
  mapLink: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  emptyIcon: {
    height: 64,
    width: 64,
  },
  emptyTitle: {
    marginTop: 12,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyButton: {
    alignItems: 'center',
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 12,
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
});
