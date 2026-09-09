import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { HELP_SCREEN_X, HelpHeader, HelpTag } from '@/components/help';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import type { PlaceStateReportResponse } from '@/placeReportApi';
import {
  PLACE_ACCESS_STATUS_LABELS,
  PLACE_FACILITY_OPTIONS,
  PLACE_FACILITY_STATUS_OPTIONS,
} from '@/report';
import { colors } from '@/styles/tokens/colors';

type PlaceStateReportDetailScreenProps = {
  readonly report: PlaceStateReportResponse | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onRetry: () => void;
  readonly onBack: () => void;
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${String(date.getFullYear())}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 장소 상태 제보 상세.
 * 장애물 제보와 달리 「아직 있어요」·「해결됐어요」가 없습니다 (BE에 상태 변경 API가 없고,
 * 장소 상태는 해결/미해결이 아니라 시점별 경험 기록이기 때문입니다).
 */
export function PlaceStateReportDetailScreen({
  report,
  isLoading,
  errorMessage,
  onRetry,
  onBack,
}: PlaceStateReportDetailScreenProps) {
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <HelpHeader onBack={onBack} title="장소 제보 상세" />
        <LoadingView message="제보를 불러오는 중입니다..." />
      </SafeAreaView>
    );
  }

  if (errorMessage !== null || !report) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <HelpHeader onBack={onBack} title="장소 제보 상세" />
        <ErrorView message={errorMessage ?? '제보를 불러오지 못했어요.'} onRetry={onRetry} />
      </SafeAreaView>
    );
  }

  const facilityRows = PLACE_FACILITY_OPTIONS.filter(
    facility => report.facilityStatuses[facility.value] !== undefined,
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="장소 제보 상세" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.titleBlock}>
          <Text color={colors.text.primary} variant="title-1" weight="semibold">
            {report.placeName}
          </Text>
          <View style={styles.tagRow}>
            <HelpTag label={PLACE_ACCESS_STATUS_LABELS[report.accessStatus]} tone="distance" />
          </View>
          <Text color={colors.text.secondary} variant="body-3">
            {report.placeAddress ?? '주소 정보가 없어요'}
          </Text>
        </View>

        {report.photoUrls.length > 0 ? (
          <View style={styles.photoRow}>
            {report.photoUrls.map(url => (
              <Image key={url} source={{ uri: url }} style={styles.photo} />
            ))}
          </View>
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <Text color={colors.text.disabled} variant="caption-1">
              사진 없음
            </Text>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text color={colors.text.secondary} variant="body-3">
              제보 ID
            </Text>
            <Text color={colors.text.primary} variant="body-3" weight="semibold">
              {String(report.id)}
            </Text>
          </View>
          <View style={styles.tableRow}>
            <Text color={colors.text.secondary} variant="body-3">
              제보 시각
            </Text>
            <Text color={colors.text.primary} variant="body-3" weight="semibold">
              {formatDateTime(report.createdAt)}
            </Text>
          </View>

          {facilityRows.map(facility => (
            <View key={facility.value} style={styles.tableRow}>
              <Text color={colors.text.secondary} variant="body-3">
                {facility.label}
              </Text>
              <Text color={colors.text.primary} variant="body-3" weight="semibold">
                {PLACE_FACILITY_STATUS_OPTIONS.find(
                  option => option.value === report.facilityStatuses[facility.value],
                )?.label ?? '-'}
              </Text>
            </View>
          ))}
        </View>

        {facilityRows.length < PLACE_FACILITY_OPTIONS.length ? (
          <Text color={colors.text.disabled} variant="caption-1">
            표에 없는 편의시설은 확인하지 못한 항목이에요.
          </Text>
        ) : null}

        {report.description ? (
          <View style={styles.memo}>
            <Text color={colors.text.secondary} variant="caption-1">
              메모
            </Text>
            <Text color={colors.text.primary} variant="body-3">
              {report.description}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    gap: 18,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 24,
  },
  titleBlock: {
    gap: 8,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  photo: {
    borderRadius: 8,
    height: 120,
    width: 120,
  },
  photoEmpty: {
    alignItems: 'center',
    backgroundColor: colors.background.regular,
    justifyContent: 'center',
  },
  table: {
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memo: {
    backgroundColor: colors.background.light,
    borderRadius: 10,
    gap: 4,
    padding: 14,
  },
});
