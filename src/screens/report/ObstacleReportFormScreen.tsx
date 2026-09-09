import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import {
  HELP_SCREEN_X,
  HelpFieldBox,
  HelpHeader,
  HelpKindChips,
  HelpPrimaryButton,
} from '@/components/help';
import type { ObstacleReportResponse } from '@/obstacleReportApi';
import {
  ISSUE_TYPE_OPTIONS,
  MAX_PHOTOS,
  MOBILITY_TYPE_OPTIONS,
  SEVERITY_OPTIONS,
  pickReportPhotos,
  toggleInList,
  useReportDraft,
} from '@/report';
import { useObstacleReportApi } from '@/useObstacleReportApi';
import { colors } from '@/styles/tokens/colors';

type ObstacleReportFormScreenProps = {
  readonly onBack: () => void;
  readonly onSubmitted: (report: ObstacleReportResponse) => void;
};

/** 제보 05 — 길 위 장애물 제보. 이 화면에서 실제 제보를 생성합니다. */
export function ObstacleReportFormScreen({ onBack, onSubmitted }: ObstacleReportFormScreenProps) {
  const insets = useSafeAreaInsets();
  const api = useObstacleReportApi();
  const { draft, patchDraft } = useReportDraft();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  // BE가 유형·심각도는 단일 값, 영향 대상은 @NotEmpty로 받습니다.
  const canSubmit =
    draft.issueTypes.length > 0 && draft.severity !== null && draft.affectedMobilityTypes.length > 0;

  async function addPhotos() {
    setPhotoNotice(null);
    const remaining = MAX_PHOTOS - draft.photos.length;

    if (remaining <= 0) {
      setPhotoNotice(`사진은 최대 ${String(MAX_PHOTOS)}장까지 첨부할 수 있어요.`);
      return;
    }

    const result = await pickReportPhotos(remaining);

    if (result.ok) {
      patchDraft({ photos: [...draft.photos, ...result.photos].slice(0, MAX_PHOTOS) });
      return;
    }
    if (result.reason === 'permissionDenied') {
      setPhotoNotice('사진 접근을 허용하면 첨부할 수 있어요.');
    }
    if (result.reason === 'unsupportedType') {
      setPhotoNotice('JPG, PNG, WebP, HEIC 이미지만 첨부할 수 있어요.');
    }
    if (result.reason === 'unavailable') {
      setPhotoNotice('이 빌드에서는 사진 첨부를 쓸 수 없어요. 사진 없이도 제보할 수 있어요.');
    }
  }

  async function submit() {
    if (!canSubmit || draft.severity === null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 사진을 먼저 올려 URL을 얻은 뒤 제보를 만듭니다 (BE는 호스팅된 URL만 받습니다).
      const photoUrls: string[] = [];
      for (const photo of draft.photos) {
        photoUrls.push(await api.uploadImage(photo));
      }

      const report = await api.create({
        lat: draft.coordinates.latitude,
        lng: draft.coordinates.longitude,
        // 시안은 유형을 복수 선택하지만 BE는 한 건에 하나만 받습니다. 첫 선택을 대표로 보냅니다.
        issueType: draft.issueTypes[0],
        severity: draft.severity,
        affectedMobilityTypes: draft.affectedMobilityTypes,
        photoUrls,
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
      <HelpHeader onBack={onBack} title="길 위 장애물 제보" />

      <View style={styles.progress}>
        <View style={styles.progressFill} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text color={colors.text.primary} variant="title-2" weight="semibold">
          어떤 장애물인가요?
        </Text>
        {draft.issueTypes.length > 1 ? (
          <Text color={colors.text.disabled} variant="caption-1">
            여러 개를 골라도 등록은 첫 번째 유형으로 접수돼요. 나머지는 따로 제보해주세요.
          </Text>
        ) : null}
        <HelpKindChips
          onToggle={value => patchDraft({ issueTypes: toggleInList(draft.issueTypes, value) })}
          options={ISSUE_TYPE_OPTIONS.map(option => option.value)}
          renderLabel={value => ISSUE_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value}
          selected={draft.issueTypes}
        />

        <Text color={colors.text.primary} style={styles.sectionTitle} variant="title-2" weight="semibold">
          누가 영향을 받나요?
        </Text>
        <HelpKindChips
          onToggle={value =>
            patchDraft({ affectedMobilityTypes: toggleInList(draft.affectedMobilityTypes, value) })
          }
          options={MOBILITY_TYPE_OPTIONS.map(option => option.value)}
          renderLabel={value => MOBILITY_TYPE_OPTIONS.find(o => o.value === value)?.label ?? value}
          selected={draft.affectedMobilityTypes}
        />

        <Text color={colors.text.primary} style={styles.sectionTitle} variant="title-2" weight="semibold">
          통행상태
        </Text>
        <HelpKindChips
          onToggle={value => patchDraft({ severity: draft.severity === value ? null : value })}
          options={SEVERITY_OPTIONS.map(option => option.value)}
          renderLabel={value => SEVERITY_OPTIONS.find(o => o.value === value)?.label ?? value}
          selected={draft.severity ? [draft.severity] : []}
        />

        <View style={styles.sectionTitleRow}>
          <Text color={colors.text.primary} variant="title-2" weight="semibold">
            사진 첨부
          </Text>
          <Text color={colors.text.disabled} variant="body-3">
            선택
          </Text>
        </View>
        <View style={styles.photoRow}>
          <Pressable
            accessibilityLabel="사진 업로드"
            accessibilityRole="button"
            onPress={() => void addPhotos()}
            style={styles.photoAdd}
          >
            <Text color={colors.text.secondary} variant="body-3">
              ＋
            </Text>
            <Text color={colors.text.secondary} variant="caption-2">
              사진 업로드
            </Text>
          </Pressable>

          {draft.photos.map(photo => (
            <Pressable
              accessibilityLabel="사진 제거"
              accessibilityRole="button"
              key={photo.uri}
              onPress={() => patchDraft({ photos: draft.photos.filter(item => item.uri !== photo.uri) })}
            >
              <Image source={{ uri: photo.uri }} style={styles.photo} />
            </Pressable>
          ))}
        </View>
        {photoNotice ? (
          <Text color={colors.text.secondary} variant="caption-1">
            {photoNotice}
          </Text>
        ) : null}

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
          placeholder="ex. 보도가 깨져서 휠체어가 지나가기 어려워요"
          value={draft.memo}
        />

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
  sectionTitle: {
    marginTop: 14,
  },
  sectionTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoAdd: {
    alignItems: 'center',
    borderColor: colors.border.regular,
    borderRadius: 4,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  photo: {
    borderRadius: 4,
    height: 96,
    width: 96,
  },
  footer: {
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
});
