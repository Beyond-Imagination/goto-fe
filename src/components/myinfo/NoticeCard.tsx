import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type NoticeCardProps = {
  readonly title: string;
  readonly body: string;
};

/** ⓘ 제목 + 본문 설명이 들어가는 연회색 안내 카드. */
export function NoticeCard({ title, body }: NoticeCardProps) {
  return (
    <View style={styles.card}>
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
  card: {
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
    // 본문은 ⓘ 아이콘 만큼 들여 써서 제목과 정렬을 맞춥니다.
    marginLeft: 20,
  },
});
