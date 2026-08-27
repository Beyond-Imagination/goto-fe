import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { FIGMA_HELP_ASSETS } from '@/design/figmaHelpAssets';
import { spacing } from '@/styles/tokens/spacing';

import { FigmaSvg } from './FigmaSvg';

type HelpHeaderProps = {
  readonly onBack: () => void;
  readonly title: string;
};

export function HelpHeader({ onBack, title }: HelpHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="이전 화면으로 이동"
        accessibilityRole="button"
        hitSlop={spacing[2]}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed ? styles.backButtonPressed : null]}
      >
        <View style={styles.backIcon}>
          <FigmaSvg height={16} source={FIGMA_HELP_ASSETS.back} width={20} />
        </View>
      </Pressable>

      <Text style={styles.title} variant="title-2" weight="semibold">
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: spacing[14],
    justifyContent: 'center',
    left: spacing[5],
    position: 'absolute',
    top: 0,
    width: spacing[14],
    zIndex: 1,
  },
  backButtonPressed: {
    opacity: 0.65,
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  header: {
    backgroundColor: '#FFFFFF',
    height: spacing[14],
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
});
