import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';
import { fontFamily } from '@/styles/tokens/typography';

type MyInfoHeaderProps = {
  readonly title: string;
  readonly onBack?: () => void;
};

/** 내 정보 화면 공통 헤더. 제목이 화면 가운데에 오고, 뒤로가기는 왼쪽 32pt에 붙습니다. */
export function MyInfoHeader({ title, onBack }: MyInfoHeaderProps) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable
          accessibilityLabel="뒤로 가기"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onBack}
          style={styles.back}
        >
          {/* 시스템 폰트에 맡기면 안드로이드에서 글리프가 작게 나와서 번들 폰트로 고정합니다. */}
          <Text color={colors.text.primary} style={styles.backIcon} variant="title-2">
            ←
          </Text>
        </Pressable>
      ) : null}
      <Text color={colors.text.primary} variant="title-2" weight="semibold">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingTop: 14,
  },
  back: {
    bottom: 0,
    justifyContent: 'center',
    left: 32,
    position: 'absolute',
    top: 14,
  },
  backIcon: {
    fontFamily: fontFamily.regular,
  },
});
