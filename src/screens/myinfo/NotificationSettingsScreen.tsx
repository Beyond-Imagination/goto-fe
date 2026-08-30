import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { NotificationToggleRow } from '@/components/myinfo/NotificationToggleRow';
import { useAsyncResource, useMyInfoApi, type NotificationSettings } from '@/myinfo';
import { colors } from '@/styles/tokens/colors';

/** 마지막 요소와 화면(홈 인디케이터) 사이 기본 여백. */
const CONTENT_BOTTOM_GAP = 40;

type NotificationKey = keyof NotificationSettings;

type NotificationItem = {
  readonly key: NotificationKey;
  readonly title: string;
  readonly description: string;
};

type NotificationSection = {
  readonly label: string;
  readonly items: readonly NotificationItem[];
};

const SECTIONS: readonly NotificationSection[] = [
  {
    label: '저장한 장소',
    items: [
      {
        key: 'savedPlaceStatusChange',
        title: '상태 변경 알림',
        description: '저장한 장소의 시설 상태가 바뀌면 알려드려요',
      },
      {
        key: 'savedPlaceNearbyObstacle',
        title: '주변 장애물 알림',
        description: '저장한 장소 주변에 새 장애물 제보가 생기면 알려드려요',
      },
    ],
  },
  {
    label: '내 제보',
    items: [
      {
        key: 'myReportConfirmed',
        title: '제보 확인 알림',
        description: '내 제보를 다른 사용자가 확인하면 알려드려요',
      },
      {
        key: 'myReportConfirmationRequested',
        title: '확인 요청 알림',
        description: '내가 제보한 곳의 정보가 오래되면 확인을 요청해요',
      },
    ],
  },
  {
    label: '도움 요청',
    items: [
      {
        key: 'nearbyHelpRequest',
        title: '주변 도움 요청',
        description: '가까운 곳에서 도움 요청이 생기면 알려드려요',
      },
      {
        key: 'myHelpRequestAccepted',
        title: '내 요청 수락',
        description: '내 도움 요청을 누군가 수락하면 알려드려요',
      },
    ],
  },
];

type NotificationSettingsScreenProps = {
  readonly onBack: () => void;
};

/** 내 정보 06 — 알림 설정. */
export function NotificationSettingsScreen({ onBack }: NotificationSettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const api = useMyInfoApi();
  const load = useCallback(() => api.getSettings(), [api]);
  const resource = useAsyncResource(load, '알림 설정을 불러오지 못했어요. 다시 시도해주세요.');

  const [draft, setDraft] = useState<{ source: NotificationSettings; value: NotificationSettings } | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 서버 응답이 새로 도착하면 편집 중인 값을 그 값으로 초기화합니다 (effect 없이 렌더 중 동기화).
  const loaded = resource.data?.notifications ?? null;
  if (loaded && draft?.source !== loaded) {
    setDraft({ source: loaded, value: loaded });
  }
  const settings = draft?.value ?? null;

  function setSetting(key: NotificationKey, value: boolean) {
    setDraft(previous => (previous ? { ...previous, value: { ...previous.value, [key]: value } } : previous));
  }

  async function save() {
    if (!settings || !resource.data || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 보기 설정은 이 화면의 관심사가 아니라 서버에서 받은 값을 그대로 되돌려 보냅니다.
      await api.updateSettings({ notifications: settings, display: resource.data.display });
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
      <MyInfoHeader onBack={onBack} title="알림 설정" />

      {resource.state === 'loading' || !settings ? (
        <LoadingView message="알림 설정을 불러오는 중입니다..." />
      ) : resource.state === 'error' ? (
        <ErrorView
          message={resource.errorMessage ?? '알림 설정을 불러오지 못했어요.'}
          onRetry={resource.reload}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + CONTENT_BOTTOM_GAP }]}
          style={styles.scroll}
        >
          <View style={styles.sections}>
            {SECTIONS.map((section, sectionIndex) => (
              <View key={section.label}>
                {sectionIndex > 0 ? <View style={styles.divider} /> : null}
                <Text color={colors.text.tertiary} variant="body-2" weight="semibold">
                  {section.label}
                </Text>
                <View style={styles.items}>
                  {section.items.map(item => (
                    <NotificationToggleRow
                      description={item.description}
                      key={item.key}
                      onValueChange={value => setSetting(item.key, value)}
                      title={item.title}
                      value={settings[item.key]}
                    />
                  ))}
                </View>
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
  sections: {
    marginTop: 50,
    paddingHorizontal: 32,
  },
  items: {
    gap: 16,
    marginTop: 16,
  },
  divider: {
    backgroundColor: colors.border.regular,
    height: StyleSheet.hairlineWidth,
    marginBottom: 21,
    marginTop: 20,
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
    marginTop: 46,
    paddingVertical: 18,
  },
});
