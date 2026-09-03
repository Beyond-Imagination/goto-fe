import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

/** 섹션 제목 옆에 붙는 작은 ⓘ 표시. 설명이 더 있다는 힌트입니다. */
export function InfoMark() {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={styles.mark}>
      <Text color={colors.text.disabled} style={styles.glyph} variant="caption-3">
        i
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    borderColor: colors.icon.disabled,
    borderRadius: 8,
    borderWidth: 1,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  glyph: {
    lineHeight: 14,
  },
});
