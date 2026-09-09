import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { HELP_SCREEN_X } from '@/components/help';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { useAsyncResource, useMyInfoApi } from '@/myinfo';
import { ISSUE_TYPE_LABELS } from '@/report';
import { colors } from '@/styles/tokens/colors';

type ReportHomeScreenProps = {
  readonly onStartReport: () => void;
  readonly onOpenMyReports: () => void;
};

/**
 * 제보 홈 (제보 탭).
 * 시안(제보 홈)은 아직 회색 자리표시자 단계라, 확정된 요소인 진입 버튼과
 * 내 활동 요약만 실제 데이터로 구성했습니다.
 */
export function ReportHomeScreen({ onStartReport, onOpenMyReports }: ReportHomeScreenProps) {
  const api = useMyInfoApi();
  const load = useCallback(() => api.getProfile(), [api]);
  const profile = useAsyncResource(load, '활동 요약을 불러오지 못했어요.');

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.intro}>
        <Text color={colors.text.primary} variant="title-1" weight="semibold">
          함께가길 제보
        </Text>
        <Text color={colors.text.secondary} variant="body-2">
          당신의 소중한 제보가 누군가의 길이 됩니다
        </Text>
      </View>

      <Pressable
        accessibilityLabel="제보하기"
        accessibilityRole="button"
        onPress={onStartReport}
        style={styles.primaryCard}
      >
        <Text color={colors.text.inverse} variant="title-2" weight="semibold">
          제보하기
        </Text>
        <Text color={colors.text.inverse} variant="body-3">
          길 위 장애물을 알려주세요
        </Text>
      </Pressable>

      <View style={styles.sectionTitleRow}>
        <Text color={colors.text.primary} variant="title-2" weight="semibold">
          내 활동 요약
        </Text>
        <Pressable accessibilityRole="button" onPress={onOpenMyReports}>
          <Text color={colors.text.secondary} variant="body-3">
            전체보기 ›
          </Text>
        </Pressable>
      </View>

      {profile.state === 'loading' ? (
        <LoadingView message="활동 요약을 불러오는 중입니다..." />
      ) : profile.state === 'error' || !profile.data ? (
        <ErrorView
          message={profile.errorMessage ?? '활동 요약을 불러오지 못했어요.'}
          onRetry={profile.reload}
        />
      ) : (
        <View style={styles.stats}>
          {[
            { label: '제보건수', unit: '건', value: profile.data.stats.reportCount },
            { label: '도움됐어요', unit: '명', value: profile.data.stats.helpedPeopleCount },
            { label: '해결 확인', unit: '건', value: profile.data.stats.resolvedConfirmationCount },
          ].map(stat => (
            <View key={stat.label} style={styles.stat}>
              <Text color={colors.text.primary} variant="title-1" weight="semibold">
                {String(stat.value)}
                {stat.unit}
              </Text>
              <Text color={colors.text.disabled} variant="body-3">
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.notice}>
        <Text color={colors.text.secondary} variant="caption-1">
          ⓘ 이런 제보가 필요해요
        </Text>
        <Text color={colors.text.disabled} style={styles.noticeBody} variant="caption-1">
          {Object.values(ISSUE_TYPE_LABELS).slice(0, 5).join(' · ')} 등 통행을 막는 것들을 알려주세요.
        </Text>
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
    gap: 18,
    paddingBottom: 32,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 24,
  },
  intro: {
    gap: 6,
  },
  primaryCard: {
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 12,
    gap: 6,
    padding: 24,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  notice: {
    backgroundColor: colors.background.light,
    borderRadius: 10,
    gap: 4,
    padding: 14,
  },
  noticeBody: {
    marginLeft: 14,
  },
});
