import { StyleSheet, View } from 'react-native';

import { colors } from '@/styles/tokens/colors';

/** 제보 리스트 아이템 사이의 가는 구분선. FlatList의 ItemSeparatorComponent로 씁니다. */
export function ListDivider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: colors.border.regular,
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
});
