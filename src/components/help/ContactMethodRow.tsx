import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type ContactMethodRowProps = {
  readonly label: string;
  readonly telephone: string;
};

/**
 * 연락처 한 줄 + 전화걸기 버튼.
 * 번호가 없는 장소는 이 줄 자체를 그리지 않습니다(호출부에서 걸러냅니다).
 */
export function ContactMethodRow({ label, telephone }: ContactMethodRowProps) {
  function call() {
    void Linking.openURL(`tel:${telephone.replace(/[^0-9+]/g, '')}`);
  }

  return (
    <View style={styles.row}>
      <Text color={colors.icon.primary} variant="body-2">
        ☎
      </Text>

      <View style={styles.body}>
        <Text color={colors.text.tertiary} variant="caption-2">
          {label}
        </Text>
        <Text color={colors.text.primary} variant="caption-1">
          {telephone}
        </Text>
      </View>

      <Pressable
        accessibilityLabel={`${label} 전화걸기`}
        accessibilityRole="button"
        onPress={call}
        style={styles.callButton}
      >
        <Text color={colors.text.inverse} variant="caption-1" weight="medium">
          전화걸기
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  body: {
    flex: 1,
  },
  callButton: {
    alignItems: 'center',
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 41,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
