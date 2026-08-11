import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

/** ⓘ 아이콘과 함께 보조 설명을 보여주는 한 줄 안내. */
export function InfoNote({ children }: { children: string }) {
  return (
    <View style={styles.note}>
      <Text color={colors.text.disabled} variant="body-3">
        ⓘ
      </Text>
      <Text color={colors.text.disabled} style={styles.text} variant="body-3">
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  text: {
    flex: 1,
  },
});
