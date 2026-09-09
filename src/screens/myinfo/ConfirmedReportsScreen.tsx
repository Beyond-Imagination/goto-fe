import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { FilterChips } from '@/components/myinfo/FilterChips';
import { ListDivider } from '@/components/myinfo/ListDivider';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { NoticeCard } from '@/components/myinfo/NoticeCard';
import { ReportListItem } from '@/components/myinfo/ReportListItem';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import { toConfirmedListItem, useAsyncResource, useMyInfoApi } from '@/myinfo';
import { colors } from '@/styles/tokens/colors';

const FILTERS = ['전체', '아직 있음', '해결 됨'] as const;

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
  const load = useCallback(() => api.findMyConfirmedReports(), [api]);
  const confirmations = useAsyncResource(load, '확인 기록을 불러오지 못했어요. 다시 시도해주세요.');
  const [filter, setFilter] = useState<Filter>('전체');

  if (confirmations.state === 'loading') {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="내가 확인한 리포트" />
        <LoadingView message="확인 기록을 불러오는 중입니다..." />
      </SafeAreaView>
    );
  }

  if (confirmations.state === 'error' || !confirmations.data) {
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

  const items = confirmations.data.map(toConfirmedListItem);
  const filtered = filter === '전체' ? items : items.filter(item => item.resolution === filter);
  const locationCount = new Set(items.map(item => item.address)).size;

  return (
    // 배경은 화면 끝까지 채우고, 하단 안전 영역은 스크롤 패딩으로만 확보합니다.
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* 헤더는 스크롤과 무관하게 고정해 뒤로가기가 항상 보이게 합니다. */}
      <MyInfoHeader onBack={onBack} title="내가 확인한 리포트" />
      {/* TODO(BE): 목록 API에 페이지네이션이 생기면 onEndReached로 다음 페이지를 이어 붙입니다. */}
      <FlatList
        ItemSeparatorComponent={ListDivider}
        ListFooterComponent={
          <View style={styles.notice}>
            <NoticeCard
              body="같은 상태를 여러 사람이 확인하면 그 리포트의 신뢰도가 높아지고, 오래된 정보는 확인 필요로 내려갑니다."
              title="확인이 쌓이면 신뢰도가 올라갑니다"
            />
          </View>
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <FilterChips onSelect={setFilter} options={FILTERS} selected={filter} />
            <Text color={colors.text.tertiary} style={styles.summary} variant="body-3">
              {`총 ${items.length}건 · 최근 확인한 위치 ${locationCount}곳`}
            </Text>
          </View>
        }
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + CONTENT_BOTTOM_GAP }]}
        data={filtered}
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
