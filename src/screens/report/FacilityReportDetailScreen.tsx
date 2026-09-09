import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { HELP_SCREEN_X, HelpHeader, HelpTag } from '@/components/help';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import type { FacilityReportResponse } from '@/facilityReportApi';
import {
  FACILITY_ISSUE_TYPE_LABELS,
  FACILITY_NODE_TYPE_LABELS,
  formatFloorLevel,
} from '@/report';
import { colors } from '@/styles/tokens/colors';

type FacilityReportDetailScreenProps = {
  readonly report: FacilityReportResponse | null;
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
 * 시설 제보 상세.
 * 「아직 있어요」·「해결됐어요」가 없는 이유는 장애물 제보와 달리 상태 변경 API가 없고,
 * 수리 완료는 「수리 완료(REPAIRED)」로 새로 제보하는 흐름이기 때문입니다.
 */
export function FacilityReportDetailScreen({
  report,
  isLoading,
  errorMessage,
  onRetry,
  onBack,
}: FacilityReportDetailScreenProps) {
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <HelpHeader onBack={onBack} title="시설 제보 상세" />
        <LoadingView message="제보를 불러오는 중입니다..." />
      </SafeAreaView>
    );
  }

  if (errorMessage !== null || !report) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <HelpHeader onBack={onBack} title="시설 제보 상세" />
        <ErrorView message={errorMessage ?? '제보를 불러오지 못했어요.'} onRetry={onRetry} />
      </SafeAreaView>
    );
  }

  const facilityLabel =
    report.nodeName ?? FACILITY_NODE_TYPE_LABELS[report.nodeType] ?? report.nodeType;
  const issueLabel =
    FACILITY_ISSUE_TYPE_LABELS[report.issueType as keyof typeof FACILITY_ISSUE_TYPE_LABELS] ??
    report.issueType;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="시설 제보 상세" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.titleBlock}>
          <Text color={colors.text.primary} variant="title-1" weight="semibold">
            {facilityLabel}
          </Text>
          <View style={styles.tagRow}>
            <HelpTag label={issueLabel} tone={report.issueType === 'REPAIRED' ? 'distance' : 'urgent'} />
            {report.calibration ? <HelpTag label="위치 보정됨" tone="distance" /> : null}
          </View>
          <Text color={colors.text.secondary} variant="body-3">
            {report.placeName} · {formatFloorLevel(report.floorLevel)}
          </Text>
        </View>

        <View style={styles.table}>
          {[
            { label: '제보 ID', value: String(report.id) },
            { label: '제보 시각', value: formatDateTime(report.createdAt) },
            { label: '시설 유형', value: FACILITY_NODE_TYPE_LABELS[report.nodeType] ?? report.nodeType },
            {
              label: '좌표',
              value: `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`,
            },
          ].map(row => (
            <View key={row.label} style={styles.tableRow}>
              <Text color={colors.text.secondary} variant="body-3">
                {row.label}
              </Text>
              <Text color={colors.text.primary} variant="body-3" weight="semibold">
                {row.value}
              </Text>
            </View>
          ))}
        </View>

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

        <View style={styles.notice}>
          <Text color={colors.text.secondary} variant="caption-1">
            ⓘ 수리가 끝났다면
          </Text>
          <Text color={colors.text.disabled} style={styles.noticeBody} variant="caption-1">
            같은 시설을 「수리 완료」로 다시 제보해주세요. 잘못된 정보가 오래 남지 않습니다.
          </Text>
        </View>
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
