import { Image, ScrollView, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { BottomBar, PrimaryButton, SkipLink } from '@/components/onboarding/Buttons';
import { InfoNote } from '@/components/onboarding/InfoNote';
import { ScreenHeader } from '@/components/onboarding/ScreenHeader';
import { SCREEN_X } from '@/components/onboarding/tokens';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

interface Permission {
  icon: ImageSourcePropType;
  title: string;
  description: string;
}

const PERMISSIONS: Permission[] = [
  {
    icon: require('../assets/perm-notification.png'),
    title: '알림 (선택)',
    description: '저장한 장소의 상태변화 알림',
  },
  {
    icon: require('../assets/perm-location.png'),
    title: '위치 (선택)',
    description: '내 주변 장소와 장애물 리포트 제공',
  },
  {
    icon: require('../assets/perm-camera.png'),
    title: '카메라 (선택)',
    description: '장애물 리포트 제보시 사용',
  },
  {
    icon: require('../assets/perm-photo.png'),
    title: '사진 (선택)',
    description: '장애물 리포트 제보시 사용',
  },
];

interface PermissionScreenProps {
  onBack: () => void;
  onConfirm: () => void;
}

export function PermissionScreen({ onBack, onConfirm }: PermissionScreenProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScreenHeader onBack={onBack} title="필수 권한 설정" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headline-1" weight="semibold">
          {'앱 사용을 위해\n접근 권한을 허용해주세요'}
        </Text>

        <View style={styles.list}>
          {PERMISSIONS.map((permission) => (
            <View key={permission.title} style={styles.row}>
              <Image resizeMode="contain" source={permission.icon} style={styles.icon} />
              <View style={styles.rowText}>
                <Text variant="body-1" weight="semibold">
                  {permission.title}
                </Text>
                <Text color={colors.text.secondary} variant="body-3">
                  {permission.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <InfoNote>사용자의 동의 없이 개인정보를 수집하거나 공유하지 않습니다.</InfoNote>
      </ScrollView>

      <BottomBar>
        <PrimaryButton label="확인" onPress={onConfirm} />
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    paddingBottom: spacing[8],
    paddingHorizontal: SCREEN_X,
    paddingTop: spacing[2],
  },
  list: {
    gap: spacing[7],
    marginTop: spacing[9],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[5],
  },
  icon: {
    height: 28,
    width: 28,
  },
  rowText: {
    flex: 1,
    gap: spacing[1],
  },
  divider: {
    backgroundColor: colors.border.regular,
    height: 1,
    marginBottom: spacing[5],
    marginTop: spacing[9],
  },
});
