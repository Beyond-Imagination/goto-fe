import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { FigmaSvg } from '@/components/help/FigmaSvg';
import { FIGMA_HELP_ASSETS } from '@/design/figmaHelpAssets';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

/** 도움 요청 흐름 전반에 반복되는 119 안내 줄. */
export function EmergencyCallNotice() {
  return (
    <View style={styles.notice}>
      <FigmaSvg height={24} source={FIGMA_HELP_ASSETS.warning} width={24} />
      <Text color={colors.text.secondary} variant="body-1">
        긴급 상황은 119에 연락하세요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing[2.5],
  },
});
