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
import type { PlaceStateReportResponse } from '@/placeReportApi';
import {
  MAX_PHOTOS,
  PLACE_ACCESS_STATUS_OPTIONS,
  PLACE_FACILITY_OPTIONS,
  PLACE_FACILITY_STATUS_OPTIONS,
  pickReportPhotos,
  useReportDraft,
} from '@/report';
import { useObstacleReportApi } from '@/useObstacleReportApi';
import { usePlaceReportApi } from '@/usePlaceReportApi';
import { colors } from '@/styles/tokens/colors';

type PlaceStateReportFormScreenProps = {
  readonly onBack: () => void;
  readonly onSubmitted: (report: PlaceStateReportResponse) => void;
};

/** 제보 03·04 — 장소 상태 제보. 이 화면에서 실제 제보를 생성합니다. */
export function PlaceStateReportFormScreen({ onBack, onSubmitted }: PlaceStateReportFormScreenProps) {
  const insets = useSafeAreaInsets();
  const placeReportApi = usePlaceReportApi();
  // 사진 업로드는 장애물 제보와 같은 업로드 API를 씁니다.
  const uploadApi = useObstacleReportApi();
  const { draft, patchDraft } = useReportDraft();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  // BE는 placeId와 accessStatus만 필수로 받습니다.
  const canSubmit = draft.placeId !== null && draft.accessStatus !== null;

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
    if (draft.placeId === null || draft.accessStatus === null || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 사진을 먼저 올려 URL을 얻은 뒤 제보를 만듭니다 (BE는 호스팅된 URL만 받습니다).
      const photoUrls: string[] = [];
      for (const photo of draft.photos) {
        photoUrls.push(await uploadApi.uploadImage(photo));
      }

      const report = await placeReportApi.create({
        placeId: draft.placeId,
        accessStatus: draft.accessStatus,
        facilityStatuses: draft.facilityStatuses,
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
      <HelpHeader onBack={onBack} title="장소 상태 제보" />

      <View style={styles.progress}>
        <View style={styles.progressFill} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* 장소명에 조사를 붙이면 「공원는」처럼 틀리므로 이름과 질문을 나눠 씁니다. */}
        <Text color={colors.text.secondary} variant="body-2">
          {draft.placeName ?? '선택한 장소'}
        </Text>
        <Text color={colors.text.primary} variant="title-2" weight="semibold">
          이 장소는 어땠나요?
        </Text>

        {PLACE_ACCESS_STATUS_OPTIONS.map(option => {
          const isSelected = draft.accessStatus === option.value;

          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option.value}
              onPress={() => patchDraft({ accessStatus: option.value })}
              style={[styles.card, isSelected ? styles.cardSelected : null]}
            >
              <Text
                color={isSelected ? colors.brand.mainAlt : colors.text.primary}
                variant="body-1"
                weight="semibold"
              >
                {isSelected ? '◉ ' : '○ '}
                {option.label}
              </Text>
              <Text
                color={isSelected ? colors.brand.mainAlt : colors.text.secondary}
                variant="body-3"
              >
                {option.description}
              </Text>
            </Pressable>
          );
        })}

        <View style={styles.sectionTitleRow}>
          <Text color={colors.text.primary} variant="title-2" weight="semibold">
            편의시설은 어땠나요?
          </Text>
          <Text color={colors.text.disabled} variant="body-3">
            선택
          </Text>
        </View>
        <Text color={colors.text.disabled} variant="caption-1">
          확인하지 못한 항목은 비워두세요. 「없어요」와 「확인 못 함」은 다르게 저장돼요.
        </Text>

        {PLACE_FACILITY_OPTIONS.map(facility => {
          const current = draft.facilityStatuses[facility.value];

          return (
          <View key={facility.value} style={styles.facilityRow}>
            <Text color={colors.text.primary} variant="body-2">
              {facility.label}
            </Text>
            <HelpKindChips
              onToggle={value =>
                patchDraft({
                  facilityStatuses: {
                    ...draft.facilityStatuses,
                    // 같은 값을 다시 누르면 「확인 못 함」으로 되돌립니다.
                    [facility.value]: current === value ? undefined : value,
                  },
                })
              }
              options={PLACE_FACILITY_STATUS_OPTIONS.map(option => option.value)}
              renderLabel={value =>
                PLACE_FACILITY_STATUS_OPTIONS.find(option => option.value === value)?.label ?? value
              }
              selected={current ? [current] : []}
            />
          </View>
          );
        })}

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
          placeholder="ex. 정문 경사로는 있지만 문이 무거워요"
          value={draft.memo}
        />

        {draft.placeId === null ? (
          <Text color={colors.text.secondary} variant="caption-1">
            장소 상태 제보는 장소를 골라야 등록할 수 있어요. 이전 화면에서 장소를 선택해주세요.
          </Text>
        ) : null}

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
  card: {
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 18,
  },
  cardSelected: {
    backgroundColor: colors.background.light,
    borderColor: colors.brand.mainAlt,
  },
  sectionTitleRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  facilityRow: {
    gap: 6,
    marginTop: 6,
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
