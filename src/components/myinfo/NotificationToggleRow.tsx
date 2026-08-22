import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { Toggle } from '@/components/onboarding/Selectors';
import { colors } from '@/styles/tokens/colors';

type NotificationToggleRowProps = {
  readonly title: string;
  readonly description: string;
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
};

/** 알림 설정 화면의 아이콘 없는 토글 줄 (제목 + 설명 + 토글). */
export function NotificationToggleRow({
  title,
  description,
  value,
  onValueChange,
}: NotificationToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text color={colors.text.primary} variant="body-1" weight="semibold">
          {title}
        </Text>
        <Text color={colors.text.secondary} variant="body-3">
          {description}
        </Text>
      </View>
      <Toggle label={title} onValueChange={onValueChange} value={value} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 30,
  },
  text: {
    flex: 1,
    gap: 4,
  },
});
