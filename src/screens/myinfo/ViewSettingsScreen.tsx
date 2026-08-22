import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { DisplayPreviewCard } from '@/components/onboarding/DisplayPreviewCard';
import { SettingRow } from '@/components/onboarding/Selectors';
import { useProfile } from '@/state/profile';
import { colors } from '@/styles/tokens/colors';

type ViewSettingsScreenProps = {
  readonly onBack: () => void;
};

/** 내 정보 07 — 접근성 보기 설정. 온보딩 「보기와 알림」과 같은 값을 다시 편집합니다. */
export function ViewSettingsScreen({ onBack }: ViewSettingsScreenProps) {
  const { profile, setDisplayOption } = useProfile();

  function save() {
    // TODO(BE): 보기 설정 저장 API가 생기면 여기서 호출합니다. 지금은 화면만 닫습니다.
    onBack();
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} style={styles.scroll}>
        <MyInfoHeader onBack={onBack} title="접근성 보기 설정" />

        {/* 큰 글씨·고대비 토글이 바로 반영되는 샘플 카드 (온보딩 3단계와 동일). */}
        <View style={styles.previewWrap}>
          <DisplayPreviewCard highContrast={profile.highContrast} largeText={profile.largeText} />
        </View>

        <View style={styles.rows}>
          <SettingRow
            description="글자 크기를 크게 표시해요"
            icon={require('../../assets/display-large-text.png')}
            onValueChange={value => setDisplayOption('largeText', value)}
            title="큰 글씨"
            value={profile.largeText}
          />
          <View style={styles.divider} />
          <SettingRow
            description="색상 대비를 높여 가독성을 개선해요"
            icon={require('../../assets/display-high-contrast.png')}
            onValueChange={value => setDisplayOption('highContrast', value)}
            title="고대비"
            value={profile.highContrast}
          />
          <View style={styles.divider} />
          <SettingRow
            description="중요 알림을 진동으로 알려드려요"
            icon={require('../../assets/display-vibration.png')}
            onValueChange={value => setDisplayOption('vibration', value)}
            title="진동 알림"
            value={profile.vibration}
          />
          <View style={styles.divider} />
          <SettingRow
            description="저장된 장소의 상태 변화를 알려드려요"
            icon={require('../../assets/display-notification.png')}
            onValueChange={value => setDisplayOption('statusAlerts', value)}
            title="상태 변경 알림"
            value={profile.statusAlerts}
          />
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
    </View>
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
  content: {
    // 탭바 위로 솟은 지도 FAB에 저장 버튼이 가리지 않도록 여유를 둡니다.
    paddingBottom: 56,
  },
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
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 50,
    paddingVertical: 18,
  },
});
