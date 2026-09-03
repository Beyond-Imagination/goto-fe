import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import {
  EmergencyCallNotice,
  HELP_SCREEN_X,
  HelpFieldBox,
  HelpHeader,
  HelpKindChips,
  HelpNoticeBox,
  HelpPrimaryButton,
  HelpStepProgress,
  DurationChips,
  InfoMark,
} from '@/components/help';
import {
  HELP_KINDS,
  helpKindLabel,
  HELP_LOCATION_MODE,
  parseFloorLevel,
  useHelpRequestApi,
  useHelpRequestDraft,
  type HelpKind,
} from '@/help';
import { colors } from '@/styles/tokens/colors';

/** 시안의 만료 시간 프리셋. BE 제약(5~120분) 안의 값입니다. */
const DURATION_OPTIONS = [10, 30, 60, 120];

type HelpRequestFormScreenProps = {
  readonly onBack: () => void;
  readonly onSubmitted: (helpRequestId: string) => void;
};

/** 도움 04 — 요청 내용 작성 후 전송. */
export function HelpRequestFormScreen({ onBack, onSubmitted }: HelpRequestFormScreenProps) {
  const insets = useSafeAreaInsets();
  const helpApi = useHelpRequestApi();
  const { draft, patchDraft } = useHelpRequestDraft();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function toggleKind(kind: HelpKind) {
    patchDraft({
      kinds: draft.kinds.includes(kind)
        ? draft.kinds.filter(item => item !== kind)
        : [...draft.kinds, kind],
    });
  }

  async function submit() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await helpApi.create({
        placeId: draft.mode === HELP_LOCATION_MODE.insidePlace ? draft.placeId : null,
        locationLabel: draft.locationLabel.trim(),
        latitude: draft.coordinates.latitude,
        longitude: draft.coordinates.longitude,
        floorLevel:
          draft.mode === HELP_LOCATION_MODE.insidePlace ? parseFloorLevel(draft.floorText) : null,
        message: draft.message.trim() || null,
        kinds: draft.kinds,
        expiresInMinutes: draft.expiresInMinutes,
      });

      onSubmitted(created.id);
    } catch {
      setSubmitError('도움 요청을 보내지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = draft.kinds.length > 0 && draft.message.trim().length > 0 && !isSubmitting;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="도움 요청" />

      <View style={styles.progress}>
        <HelpStepProgress step={2} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text color={colors.text.primary} variant="title-1" weight="semibold">
          어떤 도움이 필요하세요?
        </Text>

        <Text color={colors.text.primary} style={styles.sectionTitle} variant="title-2" weight="semibold">
          도움유형
        </Text>
        <HelpKindChips
          onToggle={toggleKind}
          options={HELP_KINDS}
          renderLabel={helpKindLabel}
          selected={draft.kinds}
        />

        <Text color={colors.text.primary} style={styles.sectionTitle} variant="title-2" weight="semibold">
          상세 메시지
        </Text>
        <HelpFieldBox
          label="상세"
          multiline
          onChangeText={message => patchDraft({ message })}
          placeholder="ex. 보도 턱 앞에서 이동 도움이 필요해요."
          required
          value={draft.message}
        />

        <View style={[styles.sectionTitle, styles.sectionTitleRow]}>
          <Text color={colors.text.primary} variant="title-2" weight="semibold">
            언제까지 도움이 필요하세요?
          </Text>
          <InfoMark />
        </View>
        <DurationChips
          onChange={expiresInMinutes => patchDraft({ expiresInMinutes })}
          options={DURATION_OPTIONS}
          value={draft.expiresInMinutes}
        />

        <View style={styles.emergency}>
          <EmergencyCallNotice />
        </View>

        <HelpNoticeBox
          body="주변 사용자에게는 대략적인 위치와 요청 내용만 보입니다. 누군가 수락하면 정확한 위치가 전달됩니다."
          title="수락 전에는 정확한 위치와 개인정보가 공개되지 않아요"
        />

        {submitError ? (
          <Text color={colors.semantic.danger.DEFAULT} variant="body-3">
            {submitError}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <HelpPrimaryButton
          disabled={!canSubmit}
          label={isSubmitting ? '보내는 중...' : '도움 요청 보내기 ✓'}
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
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 10,
  },
  content: {
    gap: 12,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 29,
  },
  sectionTitle: {
    marginTop: 20,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emergency: {
    marginVertical: 20,
  },
  footer: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
});
