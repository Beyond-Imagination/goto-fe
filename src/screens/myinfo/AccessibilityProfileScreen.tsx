import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { NoticeCard } from '@/components/myinfo/NoticeCard';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import { chipPalette } from '@/components/onboarding/tokens';
import { MOCK_ACCESSIBILITY_PROFILE } from '@/screens/myinfo/mockData';
import { MOBILITY_OPTIONS, useProfile } from '@/state/profile';
import { colors } from '@/styles/tokens/colors';

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
      <View style={styles.chips}>
        {chips.map(chip => (
          <View key={chip} style={[styles.chip, { backgroundColor: palette.solid }]}>
            <Text color={colors.text.inverse} variant="body-3" weight="medium">
              {chip}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** 내 정보 02 — 접근성 프로필. 온보딩에서 고른 값을 요약해 보여줍니다. */
export function AccessibilityProfileScreen({ onBack }: AccessibilityProfileScreenProps) {
  const { profile } = useProfile();

  const mobilityLabels = profile.mobility.map(
    id => MOBILITY_OPTIONS.find(option => option.id === id)?.label ?? id,
  );
  // TODO(BE): 저장된 프로필 조회 API가 없어서, 이 세션에서 고른 값이 없으면 피그마 목업 값을 보여줍니다.
  const hasSelection =
    profile.mobility.length > 0 || profile.facilities.length > 0 || profile.avoid.length > 0;
  const mobility = hasSelection ? mobilityLabels : MOCK_ACCESSIBILITY_PROFILE.mobility;
  const facilities = hasSelection ? profile.facilities : MOCK_ACCESSIBILITY_PROFILE.facilities;
  const avoid = hasSelection ? profile.avoid : MOCK_ACCESSIBILITY_PROFILE.avoid;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <MyInfoHeader onBack={onBack} title="접근성 프로필" />
      <View style={styles.sections}>
        <Section chips={mobility} hint="온보딩 7.2 · 복수 선택" title="이동 방식" tone="blue" />
        <Section chips={facilities} hint="(최대 3개)" title="우선 확인 시설" tone="blue" />
        <Section chips={avoid} hint="(최대 3개)" title="피하고 싶은 조건" tone="orange" />
      </View>
      <View style={styles.notice}>
        <NoticeCard
          body="핀 우선순위, 검색 정렬, 장소 상세의 정보 순서, 경로 주의 구간 표시에 함께 반영됩니다."
          title="이 설정이 지도와 검색 결과를 바꿉니다"
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
