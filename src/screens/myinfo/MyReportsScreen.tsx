import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { FilterChips } from '@/components/myinfo/FilterChips';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { ReportListItem } from '@/components/myinfo/ReportListItem';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import { MOCK_MY_REPORTS } from '@/screens/myinfo/mockData';
import { colors } from '@/styles/tokens/colors';

const FILTERS = ['전체', '장애물', '장소', '시설'] as const;

type Filter = (typeof FILTERS)[number];

type MyReportsScreenProps = {
  readonly onBack: () => void;
  readonly onStartReport: () => void;
  /** 데모용 — 빈 상태(내 정보 04) 프레임을 바로 확인하고 싶을 때 true. */
  readonly forceEmpty?: boolean;
};

/** 내 정보 03·04 — 내 제보 기록. 기록이 하나도 없으면 빈 상태 화면을 보여줍니다. */
export function MyReportsScreen({ onBack, onStartReport, forceEmpty = false }: MyReportsScreenProps) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('전체');

  // TODO(BE): 내 제보 목록 API 연동 시 교체합니다.
  const reports = forceEmpty ? [] : MOCK_MY_REPORTS;
  const filtered = filter === '전체' ? reports : reports.filter(report => report.category === filter);

  if (reports.length === 0) {
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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.filters}>
        <FilterChips onSelect={setFilter} options={FILTERS} selected={filter} />
      </View>
      <View style={styles.list}>
        {filtered.map((report, index) => (
          <View key={report.id}>
            {index > 0 ? <View style={styles.divider} /> : null}
            <ReportListItem report={report} />
          </View>
        ))}
      </View>
      <Text color={colors.text.disabled} style={styles.lastPage} variant="caption-1">
        {filtered.length > 0 ? '마지막 페이지입니다.' : '이 분류의 제보가 아직 없습니다.'}
      </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {},
  filters: {
    marginTop: 38,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  list: {
    marginTop: 18,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  divider: {
    backgroundColor: colors.border.regular,
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  lastPage: {
    marginTop: 50,
    textAlign: 'center',
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
