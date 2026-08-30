import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type HelpNoticeBoxProps = {
  readonly title: string;
  readonly body: string;
};

/** ⓘ 제목 + 본문이 들어가는 연회색 안내 박스. */
export function HelpNoticeBox({ title, body }: HelpNoticeBoxProps) {
  return (
    <View style={styles.box}>
      <View style={styles.titleRow}>
        <Text color={colors.text.disabled} variant="caption-1">
          ⓘ
        </Text>
        <Text color={colors.text.disabled} style={styles.flex} variant="caption-1">
          {title}
        </Text>
      </View>
      <Text color={colors.text.disabled} style={styles.body} variant="caption-1">
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.background.light,
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 4,
  },
  flex: {
    flex: 1,
  },
  body: {
    marginLeft: 20,
  },
});
