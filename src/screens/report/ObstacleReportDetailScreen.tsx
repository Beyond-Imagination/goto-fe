import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { HELP_SCREEN_X, HelpHeader, HelpTag, type HelpTagTone } from '@/components/help';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import type {
  ObstacleReportResponse,
  ObstacleReportStatusAction,
  ObstacleSeverity,
} from '@/obstacleReportApi';
import { ISSUE_TYPE_LABELS, MOBILITY_TYPE_OPTIONS } from '@/report';
import { SEVERITY_LABEL } from '@/screens/home/obstacleSeverityStyle';
import { useObstacleReportApi } from '@/useObstacleReportApi';
import { colors } from '@/styles/tokens/colors';

type ObstacleReportDetailScreenProps = {
  readonly report: ObstacleReportResponse | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onRetry: () => void;
  readonly onBack: () => void;
};

/** 심각도를 태그 색으로 옮깁니다 (우회권장=빨강, 주의=노랑, 참고=파랑). */
const SEVERITY_TONE: Record<ObstacleSeverity, HelpTagTone> = {
  IMPASSABLE: 'urgent',
  CAUTION: 'soon',
  INFO: 'distance',
};

const ACTION_LABEL: Record<ObstacleReportStatusAction, string> = {
  STILL_PRESENT: '아직 있어요',
  RESOLVED: '해결됐어요',
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${String(date.getFullYear())}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 제보 상세 — 내 제보 기록에서 항목을 누르면 열립니다.
 * 「아직 있어요」·「해결됐어요」는 BE POST /api/v1/obstacle-reports/{id}/status를 그대로 호출합니다.
 */
export function ObstacleReportDetailScreen({
  report,
  isLoading,
  errorMessage,
  onRetry,
  onBack,
}: ObstacleReportDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const api = useObstacleReportApi();

  // 상태 변경 결과는 서버 응답으로 덮어씁니다 (confirmedCount·stale이 함께 갱신됩니다).
  const [updated, setUpdated] = useState<ObstacleReportResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<ObstacleReportStatusAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const shown = updated ?? report;

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <HelpHeader onBack={onBack} title="제보 상세" />
        <LoadingView message="제보를 불러오는 중입니다..." />
      </SafeAreaView>
    );
  }

  if (errorMessage !== null || !shown) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <HelpHeader onBack={onBack} title="제보 상세" />
        <ErrorView message={errorMessage ?? '제보를 불러오지 못했어요.'} onRetry={onRetry} />
      </SafeAreaView>
    );
  }

  async function submitAction(action: ObstacleReportStatusAction) {
    if (pendingAction !== null || !shown) {
      return;
    }

    setPendingAction(action);
    setActionError(null);
    setActionNotice(null);

    try {
      const next = await api.updateStatus(shown.id, action);
      setUpdated(next);
      setActionNotice(
        action === 'RESOLVED'
          ? '해결됐다고 알려주셔서 고마워요. 지도에서 내려갑니다.'
          : '아직 있다고 확인해주셔서 고마워요.',
      );
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : '상태를 반영하지 못했어요. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setPendingAction(null);
    }
  }

  const isResolved = shown.status === 'RESOLVED';
  const mobilityLabels = shown.affectedMobilityTypes.map(
    type => MOBILITY_TYPE_OPTIONS.find(option => option.value === type)?.label ?? type,
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="제보 상세" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.titleBlock}>
          <Text color={colors.text.primary} variant="title-1" weight="semibold">
            {ISSUE_TYPE_LABELS[shown.issueType] ?? shown.issueType}
          </Text>
          <View style={styles.tagRow}>
            <HelpTag label={SEVERITY_LABEL[shown.severity]} tone={SEVERITY_TONE[shown.severity]} />
            {isResolved ? <HelpTag label="해결됨" tone="distance" /> : null}
            {shown.stale ? <HelpTag label="확인 필요" tone="soon" /> : null}
          </View>
        </View>

        {shown.photoUrls.length > 0 ? (
          <View style={styles.photoRow}>
            {shown.photoUrls.map(url => (
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
          {[
            { label: '제보 ID', value: String(shown.id) },
            { label: '제보 시각', value: formatDateTime(shown.createdAt) },
            {
              label: '좌표',
              value: `${shown.lat.toFixed(5)}, ${shown.lng.toFixed(5)}`,
            },
            {
              label: '영향 대상',
              value: mobilityLabels.length > 0 ? mobilityLabels.join(', ') : '-',
            },
            { label: '아직 있어요', value: `${String(shown.confirmedCount)}명` },
            {
              label: '최근 확인',
              value: shown.lastConfirmedAt ? formatDateTime(shown.lastConfirmedAt) : '아직 없음',
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

        {shown.description ? (
          <View style={styles.memo}>
            <Text color={colors.text.secondary} variant="caption-1">
              메모
            </Text>
            <Text color={colors.text.primary} variant="body-3">
              {shown.description}
            </Text>
          </View>
        ) : null}

        {actionNotice ? (
          <Text color={colors.semantic.success.dark} variant="caption-1">
            {actionNotice}
          </Text>
        ) : null}
        {actionError ? (
          <Text color={colors.semantic.danger.DEFAULT} variant="caption-1">
            {actionError}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {isResolved ? (
          <Text color={colors.text.secondary} style={styles.footerNotice} variant="body-3">
            이미 해결 처리된 제보예요.
          </Text>
        ) : (
          <View style={styles.actionRow}>
            {(['STILL_PRESENT', 'RESOLVED'] as const).map(action => (
              <Pressable
                accessibilityLabel={ACTION_LABEL[action]}
                accessibilityRole="button"
                accessibilityState={{ disabled: pendingAction !== null }}
                disabled={pendingAction !== null}
                key={action}
                onPress={() => void submitAction(action)}
                style={[
                  styles.actionButton,
                  action === 'RESOLVED' ? styles.actionPrimary : styles.actionSecondary,
                  pendingAction !== null ? styles.actionDisabled : null,
                ]}
              >
                <Text
                  color={action === 'RESOLVED' ? colors.text.inverse : colors.text.primary}
                  variant="body-1"
                  weight="semibold"
                >
                  {pendingAction === action ? '반영 중...' : ACTION_LABEL[action]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
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
  footer: {
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
  footerNotice: {
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 16,
  },
  actionSecondary: {
    borderColor: colors.border.regular,
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: colors.brand.mainAlt,
  },
  actionDisabled: {
    opacity: 0.6,
  },
});
