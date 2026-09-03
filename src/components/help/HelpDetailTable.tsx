import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

export type HelpDetailRow = {
  readonly label: string;
  readonly value: string;
  /** 수락 후 공개되는 정확한 위치처럼 강조가 필요한 행. */
  readonly highlighted?: boolean;
};

/** 「도움 유형 / 위치 / 층 / 만료까지」 라벨-값 표. */
export function HelpDetailTable({ rows }: { readonly rows: readonly HelpDetailRow[] }) {
  return (
    <View style={styles.table}>
      {rows.map((row, index) => (
        <View key={row.label} style={[styles.row, index > 0 ? styles.rowDivided : null]}>
          <Text color={colors.text.tertiary} variant="caption-1">
            {row.label}
          </Text>
          <Text
            color={row.highlighted ? colors.brand.mainAlt : colors.text.primary}
            numberOfLines={1}
            style={styles.value}
            variant="body-3"
            weight="semibold"
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  rowDivided: {
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  value: {
    flexShrink: 1,
    marginLeft: 12,
    textAlign: 'right',
  },
});
