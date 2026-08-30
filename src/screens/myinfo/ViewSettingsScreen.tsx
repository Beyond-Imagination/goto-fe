import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { DisplayPreviewCard } from '@/components/onboarding/DisplayPreviewCard';
import { SettingRow } from '@/components/onboarding/Selectors';
import { useAsyncResource, useMyInfoApi, type DisplaySettings } from '@/myinfo';
import { colors } from '@/styles/tokens/colors';

/** 마지막 요소와 화면(홈 인디케이터) 사이 기본 여백. */
const CONTENT_BOTTOM_GAP = 40;

type DisplayKey = keyof DisplaySettings;

type DisplayRow = {
  readonly key: DisplayKey;
  readonly title: string;
  readonly description: string;
  readonly icon: number;
};

const ROWS: readonly DisplayRow[] = [
  {
    key: 'largeText',
    title: '큰 글씨',
    description: '글자 크기를 크게 표시해요',
    icon: require('../../assets/display-large-text.png'),
  },
  {
    key: 'highContrast',
    title: '고대비',
    description: '색상 대비를 높여 가독성을 개선해요',
    icon: require('../../assets/display-high-contrast.png'),
  },
  {
    key: 'vibration',
    title: '진동 알림',
    description: '중요 알림을 진동으로 알려드려요',
    icon: require('../../assets/display-vibration.png'),
  },
  {
    key: 'statusAlerts',
    title: '상태 변경 알림',
    description: '저장된 장소의 상태 변화를 알려드려요',
    icon: require('../../assets/display-notification.png'),
  },
];

type ViewSettingsScreenProps = {
  readonly onBack: () => void;
};

/** 내 정보 07 — 접근성 보기 설정. */
export function ViewSettingsScreen({ onBack }: ViewSettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const api = useMyInfoApi();
  const load = useCallback(() => api.getSettings(), [api]);
  const resource = useAsyncResource(load, '보기 설정을 불러오지 못했어요. 다시 시도해주세요.');

  const [draft, setDraft] = useState<{ source: DisplaySettings; value: DisplaySettings } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 서버 응답이 새로 도착하면 편집 중인 값을 그 값으로 초기화합니다 (effect 없이 렌더 중 동기화).
  const loaded = resource.data?.display ?? null;
  if (loaded && draft?.source !== loaded) {
    setDraft({ source: loaded, value: loaded });
  }
  const display = draft?.value ?? null;

  function setOption(key: DisplayKey, value: boolean) {
    setDraft(previous => (previous ? { ...previous, value: { ...previous.value, [key]: value } } : previous));
  }

  async function save() {
    if (!display || !resource.data || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 알림 설정은 이 화면의 관심사가 아니라 서버에서 받은 값을 그대로 되돌려 보냅니다.
      await api.updateSettings({ notifications: resource.data.notifications, display });
      onBack();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '설정을 저장하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    // 배경은 화면 끝까지 채우고, 하단 안전 영역은 스크롤 패딩으로만 확보합니다.
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* 헤더는 스크롤과 무관하게 고정해 뒤로가기가 항상 보이게 합니다. */}
      <MyInfoHeader onBack={onBack} title="접근성 보기 설정" />

      {resource.state === 'loading' || !display ? (
        <LoadingView message="보기 설정을 불러오는 중입니다..." />
      ) : resource.state === 'error' ? (
        <ErrorView
          message={resource.errorMessage ?? '보기 설정을 불러오지 못했어요.'}
          onRetry={resource.reload}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + CONTENT_BOTTOM_GAP }]}
          style={styles.scroll}
        >
          {/* 큰 글씨·고대비 토글이 바로 반영되는 샘플 카드 (온보딩 3단계와 동일). */}
          <View style={styles.previewWrap}>
            <DisplayPreviewCard highContrast={display.highContrast} largeText={display.largeText} />
          </View>

          <View style={styles.rows}>
            {ROWS.map((row, index) => (
              <View key={row.key}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <SettingRow
                  description={row.description}
                  icon={row.icon}
                  onValueChange={value => setOption(row.key, value)}
                  title={row.title}
                  value={display[row.key]}
                />
              </View>
            ))}
          </View>

          {saveError ? (
            <Text color={colors.semantic.danger.DEFAULT} style={styles.saveError} variant="caption-1">
              {saveError}
            </Text>
          ) : null}

          <Pressable
            accessibilityLabel="설정 저장"
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving }}
            disabled={isSaving}
            onPress={() => void save()}
            style={styles.saveButton}
          >
            <Text color={colors.text.inverse} variant="body-2" weight="semibold">
              {isSaving ? '저장 중...' : '설정 저장 ✓'}
            </Text>
          </Pressable>
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
  scroll: {
    flex: 1,
  },
  content: {},
  previewWrap: {
    marginHorizontal: 32,
    marginTop: 38,
  },
  rows: {
    gap: 16,
    marginHorizontal: 32,
    marginTop: 24,
  },
  divider: {
    backgroundColor: colors.border.regular,
    height: StyleSheet.hairlineWidth,
  },
  saveError: {
    marginTop: 20,
    paddingHorizontal: 32,
    textAlign: 'center',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 50,
    paddingVertical: 18,
  },
});
