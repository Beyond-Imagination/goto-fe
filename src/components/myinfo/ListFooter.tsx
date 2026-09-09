import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type ListFooterProps = {
  readonly hasNext: boolean;
  readonly isLoadingMore: boolean;
  readonly errorMessage: string | null;
  readonly onRetry: () => void;
  /** 더 불러올 게 없을 때 보여줄 문구. */
  readonly endMessage: string;
};

/** 커서 페이지네이션 목록의 하단. 더 불러오는 중·실패·마지막 페이지를 구분해 알려줍니다. */
export function ListFooter({
  hasNext,
  isLoadingMore,
  errorMessage,
  onRetry,
  endMessage,
}: ListFooterProps) {
  if (errorMessage !== null) {
    return (
      <View style={styles.footer}>
        <Text color={colors.text.secondary} style={styles.message} variant="caption-1">
          {errorMessage}
        </Text>
        <Pressable
          accessibilityLabel="다음 페이지 다시 불러오기"
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.retry}
        >
          <Text color={colors.brand.mainAlt} variant="body-3" weight="semibold">
            다시 시도
          </Text>
        </Pressable>
      </View>
    );
  }

  if (isLoadingMore) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.brand.mainAlt} />
      </View>
    );
  }

  if (hasNext) {
    // 스크롤로 자동 이어붙이므로 안내만 둡니다.
    return (
      <View style={styles.footer}>
        <Text color={colors.text.disabled} style={styles.message} variant="caption-1">
          더 내리면 이어서 불러옵니다.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.footer}>
      <Text color={colors.text.disabled} style={styles.message} variant="caption-1">
        {endMessage}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
  },
  message: {
    textAlign: 'center',
  },
  retry: {
    paddingVertical: 6,
  },
});
