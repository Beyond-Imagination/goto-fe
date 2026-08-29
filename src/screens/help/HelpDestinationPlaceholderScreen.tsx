import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { HelpHeader } from '@/components/help/HelpHeader';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

type HelpDestinationPlaceholderScreenProps = {
  readonly title: string;
};

export function HelpDestinationPlaceholderScreen({ title }: HelpDestinationPlaceholderScreenProps) {
  const router = useRouter();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)/location');
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <HelpHeader onBack={handleBack} title={title} />
      <View style={styles.content}>
        <Text color={colors.text.secondary} variant="body-1">
          준비 중입니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing[5],
  },
  safeArea: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
});
