import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { toUnreadBadge } from '@/notifications';
import { colors } from '@/styles/tokens/colors';

/** 벨 아이콘 위에 얹는 안 읽음 배지. 0이면 아무 것도 그리지 않습니다. */
export function UnreadBadge({ count }: { readonly count: number | null }) {
  const label = toUnreadBadge(count ?? 0);

  if (label === null) {
    return null;
  }

  return (
    <View style={styles.badge}>
      <Text color={colors.text.inverse} style={styles.label} variant="caption-3" weight="semibold">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.semantic.danger.DEFAULT,
    borderRadius: 100,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: 'absolute',
    right: -8,
    top: -6,
  },
  label: {
    lineHeight: 14,
  },
});
