import { useCallback } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { NoticeCard } from '@/components/myinfo/NoticeCard';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import { chipPalette } from '@/components/onboarding/tokens';
import {
  toAvoidConditionLabels,
  toMobilityLabels,
  toPriorityFacilityLabels,
  useAsyncResource,
  useMyInfoApi,
} from '@/myinfo';
import { colors } from '@/styles/tokens/colors';

/** 마지막 요소와 화면(홈 인디케이터) 사이 기본 여백. */
const CONTENT_BOTTOM_GAP = 24;

type AccessibilityProfileScreenProps = {
  readonly onBack: () => void;
};

type SectionProps = {
  readonly title: string;
  readonly hint: string;
  readonly chips: readonly string[];
  readonly tone: 'blue' | 'orange';
};

function Section({ title, hint, chips, tone }: SectionProps) {
  const palette = tone === 'blue' ? chipPalette.blue : chipPalette.orange;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text color={colors.text.primary} variant="title-2" weight="semibold">
            {title}
          </Text>
          <Text color={colors.text.secondary} variant="body-3">
            {hint}
          </Text>
        </View>
        {/* TODO: 항목별 수정 화면이 정의되면 화살표에 이동을 연결합니다. */}
        <Image source={require('../../assets/icons/chevron-right.png')} style={styles.sectionChevron} />
      </View>
      {chips.length > 0 ? (
        <View style={styles.chips}>
          {chips.map(chip => (
            <View key={chip} style={[styles.chip, { backgroundColor: palette.solid }]}>
              <Text color={colors.text.inverse} variant="body-3" weight="medium">
                {chip}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text color={colors.text.disabled} variant="body-3">
          아직 선택한 항목이 없어요.
        </Text>
      )}
    </View>
  );
}

/** 내 정보 02 — 접근성 프로필. 서버에 저장된 preferences를 요약해 보여줍니다. */
export function AccessibilityProfileScreen({ onBack }: AccessibilityProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const api = useMyInfoApi();
  const load = useCallback(() => api.getPreferences(), [api]);
  const preferences = useAsyncResource(load, '접근성 프로필을 불러오지 못했어요. 다시 시도해주세요.');

  return (
    // 배경은 화면 끝까지 채우고, 하단 안전 영역은 스크롤 패딩으로만 확보합니다.
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* 헤더는 스크롤과 무관하게 고정해 뒤로가기가 항상 보이게 합니다. */}
      <MyInfoHeader onBack={onBack} title="접근성 프로필" />

      {preferences.state === 'loading' ? (
        <LoadingView message="접근성 프로필을 불러오는 중입니다..." />
      ) : preferences.state === 'error' || !preferences.data ? (
        <ErrorView
          message={preferences.errorMessage ?? '접근성 프로필을 불러오지 못했어요.'}
          onRetry={preferences.reload}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + CONTENT_BOTTOM_GAP }]}
        >
          <View style={styles.sections}>
            <Section
              chips={toMobilityLabels(preferences.data.mobilityModes)}
              hint="복수 선택"
              title="이동 방식"
              tone="blue"
            />
            <Section
              chips={toPriorityFacilityLabels(preferences.data.priorityFacilities)}
              hint="(최대 3개)"
              title="우선 확인 시설"
              tone="blue"
            />
            <Section
              chips={toAvoidConditionLabels(preferences.data.avoidConditions)}
              hint="(최대 3개)"
              title="피하고 싶은 조건"
              tone="orange"
            />
          </View>
          <View style={styles.notice}>
            <NoticeCard
              body="핀 우선순위, 검색 정렬, 장소 상세의 정보 순서, 경로 주의 구간 표시에 함께 반영됩니다."
              title="이 설정이 지도와 검색 결과를 바꿉니다"
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {},
  sections: {
    gap: 24,
    marginTop: 38,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 8,
  },
  sectionChevron: {
    height: 20,
    width: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 24,
    paddingHorizontal: 15,
    paddingVertical: 14,
  },
  notice: {
    marginTop: 40,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
});
