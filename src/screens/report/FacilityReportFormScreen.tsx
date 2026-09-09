import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import {
  HELP_SCREEN_X,
  HelpFieldBox,
  HelpHeader,
  HelpKindChips,
  HelpPrimaryButton,
} from '@/components/help';
import type { FacilityReportResponse } from '@/facilityReportApi';
import {
  FACILITY_ISSUE_TYPE_OPTIONS,
  formatFloorLevel,
  useReportDraft,
} from '@/report';
import { useFacilityReportApi } from '@/useFacilityReportApi';
import { colors } from '@/styles/tokens/colors';

type FacilityReportFormScreenProps = {
  readonly onBack: () => void;
  readonly onSubmitted: (report: FacilityReportResponse) => void;
};

/** 제보 06 — 시설 상태 제보. 이 화면에서 실제 제보를 생성합니다. */
export function FacilityReportFormScreen({ onBack, onSubmitted }: FacilityReportFormScreenProps) {
  const insets = useSafeAreaInsets();
  const api = useFacilityReportApi();
  const { draft, patchDraft } = useReportDraft();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // BE는 nodeId와 issueType만 필수로 받습니다.
  const canSubmit = draft.facilityNodeId !== null && draft.facilityIssueType !== null;

  async function submit() {
    if (draft.facilityNodeId === null || draft.facilityIssueType === null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const report = await api.create({
        nodeId: draft.facilityNodeId,
        issueType: draft.facilityIssueType,
        description: draft.memo,
      });

      onSubmitted(report);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : '제보를 등록하지 못했어요. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="시설 상태 제보" />

      <View style={styles.progress}>
        <View style={styles.progressFill} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* 시설명에 조사를 붙이면 「엘리베이터은」처럼 틀리므로 이름과 질문을 나눠 씁니다. */}
        <Text color={colors.text.secondary} variant="body-2">
          {draft.placeName ?? '선택한 장소'} · {formatFloorLevel(draft.facilityFloorLevel)} ·{' '}
          {draft.facilityNodeLabel ?? '선택한 시설'}
        </Text>
        <Text color={colors.text.primary} variant="title-2" weight="semibold">
          어떤 상태인가요?
        </Text>

        <HelpKindChips
          onToggle={value =>
            patchDraft({ facilityIssueType: draft.facilityIssueType === value ? null : value })
          }
          options={FACILITY_ISSUE_TYPE_OPTIONS.map(option => option.value)}
          renderLabel={value =>
            FACILITY_ISSUE_TYPE_OPTIONS.find(option => option.value === value)?.label ?? value
          }
          selected={draft.facilityIssueType ? [draft.facilityIssueType] : []}
        />

        <View style={styles.sectionTitleRow}>
          <Text color={colors.text.primary} variant="title-2" weight="semibold">
            메모
          </Text>
          <Text color={colors.text.disabled} variant="body-3">
            선택
          </Text>
        </View>
        <HelpFieldBox
          label="메모"
          multiline
          onChangeText={memo => patchDraft({ memo })}
          placeholder="ex. 점검 안내문만 붙어 있고 언제 고쳐지는지 안 적혀 있어요"
          value={draft.memo}
        />

        {/* 시설 사진은 BE 제보 API에 사진 필드가 없어 아직 첨부할 수 없습니다. */}
        <Text color={colors.text.disabled} variant="caption-2">
          시설 제보는 아직 사진을 첨부할 수 없어요. 상황은 메모로 알려주세요.
        </Text>

        <View style={styles.notice}>
          <Text color={colors.text.secondary} variant="caption-1">
            ⓘ 위치도 함께 보정돼요
          </Text>
          <Text color={colors.text.disabled} style={styles.noticeBody} variant="caption-1">
            엘리베이터·화장실처럼 위치가 확실한 시설을 제보하면 실내 지도의 내 위치가 그 지점으로 맞춰집니다.
          </Text>
        </View>

        {submitError ? (
          <Text color={colors.semantic.danger.DEFAULT} variant="caption-1">
            {submitError}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <HelpPrimaryButton
          disabled={!canSubmit || isSubmitting}
          label={isSubmitting ? '등록 중...' : '제보 등록'}
          onPress={() => void submit()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  progress: {
    backgroundColor: colors.brand.mainAlt,
    height: 4,
    marginHorizontal: HELP_SCREEN_X,
  },
  progressFill: {
    height: 4,
  },
  content: {
    gap: 10,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 24,
  },
  sectionTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  notice: {
    backgroundColor: colors.background.light,
    borderRadius: 10,
    gap: 4,
    marginTop: 10,
    padding: 14,
  },
  noticeBody: {
    marginLeft: 14,
  },
  footer: {
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
});
