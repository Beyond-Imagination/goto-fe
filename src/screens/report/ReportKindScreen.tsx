import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { HELP_SCREEN_X, HelpHeader, HelpPrimaryButton } from '@/components/help';
import { REPORT_KIND_OPTIONS, useReportDraft, type ReportKind } from '@/report';
import { colors } from '@/styles/tokens/colors';

type ReportKindScreenProps = {
  readonly onBack: () => void;
  readonly onNext: () => void;
};

/** 제보 01 — 무엇을 제보할까요? */
export function ReportKindScreen({ onBack, onNext }: ReportKindScreenProps) {
  const insets = useSafeAreaInsets();
  const { draft, patchDraft } = useReportDraft();

  function select(kind: ReportKind) {
    patchDraft({ kind });
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="제보하기" />

      <View style={styles.progress}>
        <View style={styles.progressFill} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.intro}>
          <Text color={colors.text.primary} variant="title-1" weight="semibold">
            무엇을 제보할까요?
          </Text>
          <Text color={colors.text.secondary} variant="body-1">
            제보 유형을 선택해주세요
          </Text>
        </View>

        {REPORT_KIND_OPTIONS.map(option => {
          const isSelected = draft.kind === option.kind;
          const isDisabled = option.disabledReason !== undefined;

          return (
            <Pressable
              accessibilityLabel={option.title}
              accessibilityRole="button"
              accessibilityState={{ disabled: isDisabled, selected: isSelected }}
              disabled={isDisabled}
              key={option.kind}
              onPress={() => select(option.kind)}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : null,
                isDisabled ? styles.cardDisabled : null,
              ]}
            >
              <Text
                color={isDisabled ? colors.text.disabled : isSelected ? colors.brand.mainAlt : colors.text.primary}
                variant="body-1"
                weight="semibold"
              >
                {isSelected ? '◉ ' : '○ '}
                {option.title}
              </Text>
              <Text
                color={isDisabled ? colors.text.disabled : isSelected ? colors.brand.mainAlt : colors.text.secondary}
                style={styles.cardDescription}
                variant="body-3"
              >
                {option.description}
              </Text>
              {/* BE에 대응 API가 없는 유형은 이유를 그대로 보여줍니다. */}
              {option.disabledReason ? (
                <Text color={colors.text.disabled} style={styles.cardNotice} variant="caption-2">
                  준비 중 · {option.disabledReason}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <HelpPrimaryButton disabled={draft.kind === null} label="다음" onPress={onNext} />
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
    backgroundColor: colors.border.light,
    height: 4,
    marginHorizontal: HELP_SCREEN_X,
  },
  progressFill: {
    backgroundColor: colors.brand.mainAlt,
    height: 4,
    // 3단계 중 1단계.
    width: '33%',
  },
  content: {
    gap: 12,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 24,
  },
  intro: {
    gap: 6,
    marginBottom: 12,
  },
  card: {
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 20,
  },
  cardSelected: {
    backgroundColor: colors.background.light,
    borderColor: colors.brand.mainAlt,
  },
  cardDisabled: {
    backgroundColor: colors.background.light,
  },
  cardDescription: {
    marginTop: 2,
  },
  cardNotice: {
    marginTop: 6,
  },
  footer: {
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
});
