import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { NotificationToggleRow } from '@/components/myinfo/NotificationToggleRow';
import { colors } from '@/styles/tokens/colors';

/** 마지막 요소와 화면(홈 인디케이터) 사이 기본 여백. */
const CONTENT_BOTTOM_GAP = 40;

type NotificationKey =
  | 'savedStatusChange'
  | 'savedNearbyObstacle'
  | 'reportConfirmed'
  | 'confirmRequested'
  | 'nearbyHelpRequest'
  | 'helpRequestAccepted';

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
        key: 'savedStatusChange',
        title: '상태 변경 알림',
        description: '저장한 장소의 시설 상태가 바뀌면 알려드려요',
      },
      {
        key: 'savedNearbyObstacle',
        title: '주변 장애물 알림',
        description: '저장한 장소 주변에 새 장애물 제보가 생기면 알려드려요',
      },
    ],
  },
  {
    label: '내 제보',
    items: [
      {
        key: 'reportConfirmed',
        title: '제보 확인 알림',
        description: '내 제보를 다른 사용자가 확인하면 알려드려요',
      },
      {
        key: 'confirmRequested',
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
        key: 'helpRequestAccepted',
        title: '내 요청 수락',
        description: '내 도움 요청을 누군가 수락하면 알려드려요',
      },
    ],
  },
];

/** 사용자가 직접 고르기 전까지는 아무것도 켜지 않은 상태로 시작합니다. */
const INITIAL_SETTINGS: Record<NotificationKey, boolean> = {
  savedStatusChange: false,
  savedNearbyObstacle: false,
  reportConfirmed: false,
  confirmRequested: false,
  nearbyHelpRequest: false,
  helpRequestAccepted: false,
};

type NotificationSettingsScreenProps = {
  readonly onBack: () => void;
};

/** 내 정보 06 — 알림 설정. */
export function NotificationSettingsScreen({ onBack }: NotificationSettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  function setSetting(key: NotificationKey, value: boolean) {
    setSettings(previous => ({ ...previous, [key]: value }));
  }

  function save() {
    // TODO(BE): 알림 설정 저장 API가 생기면 여기서 호출합니다. 지금은 화면만 닫습니다.
    onBack();
  }

  return (
    // 배경은 화면 끝까지 채우고, 하단 안전 영역은 스크롤 패딩으로만 확보합니다.
    <SafeAreaView edges={['top']} style={styles.screen}>
      {/* 헤더는 스크롤과 무관하게 고정해 뒤로가기가 항상 보이게 합니다. */}
      <MyInfoHeader onBack={onBack} title="알림 설정" />
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
        <Pressable
          accessibilityLabel="설정 저장"
          accessibilityRole="button"
          onPress={save}
          style={styles.saveButton}
        >
          <Text color={colors.text.inverse} variant="body-2" weight="semibold">
            설정 저장 ✓
          </Text>
        </Pressable>
      </ScrollView>
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
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 46,
    paddingVertical: 18,
  },
});
