import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

import { helpTagPalette } from './tokens';

export type HelpTagTone = 'urgent' | 'soon' | 'distance';

type HelpTagProps = {
  readonly label: string;
  readonly tone: HelpTagTone;
};

/** 「48분 남음」 「120m」처럼 테두리만 있는 작은 상태 태그. */
export function HelpTag({ label, tone }: HelpTagProps) {
  const color = helpTagPalette[tone];

  return (
    <View style={[styles.tag, { borderColor: color }]}>
      <Text color={color} variant="caption-2">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: colors.background.primary,
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
});
