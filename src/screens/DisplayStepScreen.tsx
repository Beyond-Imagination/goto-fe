import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { SettingRow } from '@/components/onboarding/Selectors';
import { contrastPreview } from '@/components/onboarding/tokens';
import { useProfile } from '@/state/profile';
import { colors } from '@/styles/tokens/colors';
import { radius } from '@/styles/tokens/radius';
import { spacing } from '@/styles/tokens/spacing';
import { fontFamily } from '@/styles/tokens/typography';
import { ProfileStepLayout } from './ProfileStepLayout';

/** 큰 글씨를 켜면 미리보기 글자 크기가 이 배율만큼 커집니다. */
const LARGE_TEXT_SCALE = 1.25;

interface DisplayStepScreenProps {
  onBack: () => void;
  onDone: () => void;
  onSkip: () => void;
}

export function DisplayStepScreen({ onBack, onDone, onSkip }: DisplayStepScreenProps) {
  const { profile, setDisplayOption } = useProfile();

  const scale = profile.largeText ? LARGE_TEXT_SCALE : 1;
  const { highContrast } = profile;

  return (
    <ProfileStepLayout
      nextLabel="완료"
      onBack={onBack}
      onNext={onDone}
      onSkip={onSkip}
      step={3}
      subtitle="사용자 맞춤 화면설정과 필요한 알림을 받을 수 있어요"
      title="보기와 알림 설정"
    >
      <View style={styles.preview}>
        <Text
          color={highContrast ? contrastPreview.title : colors.text.primary}
          style={[styles.previewDisplay, { fontSize: 56 * scale, lineHeight: 56 * scale }]}
          variant="display-1"
        >
          Tittle
        </Text>
        <Text
          color={highContrast ? contrastPreview.title : colors.text.secondary}
          style={[styles.previewTitle, { fontSize: 32 * scale, lineHeight: 41.6 * scale }]}
          variant="headline-1"
          weight="semibold"
        >
          함께하길과 함께 가요
        </Text>
        <Text
          color={highContrast ? contrastPreview.body : colors.text.tertiary}
          style={[styles.previewBody, { fontSize: 20 * scale, lineHeight: 28 * scale }]}
          variant="title-2"
          weight="medium"
        >
          {'함께 하길은 여러분이 가는\n길을 밝혀나갑니다'}
        </Text>
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
    </ProfileStepLayout>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderColor: colors.border.regular,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing[6],
    padding: spacing[5],
  },
  previewDisplay: {
    fontFamily: fontFamily.semibold,
  },
  previewTitle: {
    marginTop: spacing[1.5],
  },
  previewBody: {
    marginTop: spacing[2.5],
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
