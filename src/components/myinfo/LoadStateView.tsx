import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

type LoadingViewProps = {
  readonly message: string;
};

export function LoadingView({ message }: LoadingViewProps) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.brand.mainAlt} size="large" />
      <Text color={colors.text.tertiary} style={styles.text} variant="body-3">
        {message}
      </Text>
    </View>
  );
}

type ErrorViewProps = {
  readonly message: string;
  readonly onRetry: () => void;
};

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.center}>
      <Text color={colors.semantic.danger.DEFAULT} style={styles.text} variant="body-2">
        {message}
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}>
        <Text color={colors.text.primary} variant="body-3" weight="semibold">
          다시 시도
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  text: {
    marginTop: 12,
    textAlign: 'center',
  },
  retry: {
    borderColor: colors.border.regular,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
});
