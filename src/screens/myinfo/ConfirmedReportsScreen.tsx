import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { FilterChips } from '@/components/myinfo/FilterChips';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { NoticeCard } from '@/components/myinfo/NoticeCard';
import { ReportListItem } from '@/components/myinfo/ReportListItem';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import { MOCK_CONFIRMED_REPORTS, MOCK_CONFIRMED_SUMMARY } from '@/screens/myinfo/mockData';
import { colors } from '@/styles/tokens/colors';

const FILTERS = ['전체', '아직 있음', '해결 됨'] as const;

type Filter = (typeof FILTERS)[number];

type ConfirmedReportsScreenProps = {
  readonly onBack: () => void;
};

/** 내 정보 05 — 내가 확인한 리포트. */
export function ConfirmedReportsScreen({ onBack }: ConfirmedReportsScreenProps) {
  const [filter, setFilter] = useState<Filter>('전체');

  // TODO(BE): 확인 기록 API 연동 시 교체합니다.
  const filtered =
    filter === '전체'
      ? MOCK_CONFIRMED_REPORTS
      : MOCK_CONFIRMED_REPORTS.filter(report => report.resolution === filter);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <MyInfoHeader onBack={onBack} title="내가 확인한 리포트" />
      <View style={styles.filters}>
        <FilterChips onSelect={setFilter} options={FILTERS} selected={filter} />
      </View>
      <Text color={colors.text.tertiary} style={styles.summary} variant="body-3">
        {MOCK_CONFIRMED_SUMMARY}
      </Text>
      <View style={styles.list}>
        {filtered.map((report, index) => (
          <View key={report.id}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <ReportListItem report={report} />
          </View>
        ))}
      </View>
      <View style={styles.notice}>
        <NoticeCard
          body="같은 상태를 여러 사람이 확인하면 그 리포트의 신뢰도가 높아지고, 오래된 정보는 확인 필요로 내려갑니다."
          title="확인이 쌓이면 신뢰도가 올라갑니다"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  filters: {
    marginTop: 38,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  summary: {
    marginTop: 18,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  list: {
    marginTop: 12,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  divider: {
    backgroundColor: colors.border.regular,
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  notice: {
    marginTop: 26,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
});
