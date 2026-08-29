import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { DisplayPreviewCard } from '@/components/onboarding/DisplayPreviewCard';
import { SettingRow } from '@/components/onboarding/Selectors';
import { useProfile } from '@/state/profile';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

export function DisplayStepScreen() {
  const { profile, setDisplayOption } = useProfile();

  return (
    <View style={styles.container}>
      {/* 큰 글씨·고대비 토글이 바로 반영되는 샘플 카드. 접근성 보기 설정 화면과 함께 씁니다. */}
      <View style={styles.previewWrap}>
        <DisplayPreviewCard highContrast={profile.highContrast} largeText={profile.largeText} />
      </View>

      <View style={styles.group}>
        <SettingRow
          description="글자 크기를 크게 표시해요"
          icon={require('../assets/display-large-text.png')}
          onValueChange={(next) => setDisplayOption('largeText', next)}
          title="큰 글씨"
          value={profile.largeText}
        />
        <View style={styles.divider} />
        <SettingRow
          description="색상 대비를 높여 가독성을 개선해요"
          icon={require('../assets/display-high-contrast.png')}
          onValueChange={(next) => setDisplayOption('highContrast', next)}
          title="고대비"
          value={profile.highContrast}
        />
      </View>

      <Text style={styles.groupTitle} variant="headline-2" weight="semibold">
        알림 설정
      </Text>

      <View style={styles.group}>
        <SettingRow
          description="중요 알림을 진동으로 알려드려요"
          icon={require('../assets/display-vibration.png')}
          onValueChange={(next) => setDisplayOption('vibration', next)}
          title="진동 알림"
          value={profile.vibration}
        />
        <View style={styles.divider} />
        <SettingRow
          description="저장된 장소의 상태 변화를 알려드려요"
          icon={require('../assets/display-notification.png')}
          onValueChange={(next) => setDisplayOption('statusAlerts', next)}
          title="상태 변경 알림"
          value={profile.statusAlerts}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewWrap: {
    marginTop: spacing[6],
  },
  group: {
    marginTop: spacing[2],
  },
  groupTitle: {
    marginTop: spacing[7],
  },
  divider: {
    backgroundColor: colors.border.regular,
    height: StyleSheet.hairlineWidth,
  },
});
