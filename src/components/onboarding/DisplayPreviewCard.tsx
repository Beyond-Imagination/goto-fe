import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { contrastPreview } from '@/components/onboarding/tokens';
import { colors } from '@/styles/tokens/colors';
import { radius } from '@/styles/tokens/radius';
import { spacing } from '@/styles/tokens/spacing';
import { fontFamily } from '@/styles/tokens/typography';

/** 큰 글씨를 켜면 미리보기 글자 크기가 이 배율만큼 커집니다. */
const LARGE_TEXT_SCALE = 1.25;

type DisplayPreviewCardProps = {
  readonly largeText: boolean;
  readonly highContrast: boolean;
};

/** 큰 글씨·고대비 토글이 즉시 반영되는 샘플 카드. 온보딩 3단계와 접근성 보기 설정이 함께 씁니다. */
export function DisplayPreviewCard({ largeText, highContrast }: DisplayPreviewCardProps) {
  const scale = largeText ? LARGE_TEXT_SCALE : 1;

  return (
    <View style={styles.preview}>
      <Text
        color={highContrast ? contrastPreview.title : colors.text.primary}
        style={[styles.previewDisplay, { fontSize: 56 * scale, lineHeight: 56 * scale }]}
        variant="display-1"
      >
        Title
      </Text>
      <Text
        color={highContrast ? contrastPreview.title : colors.text.secondary}
        style={[styles.previewTitle, { fontSize: 32 * scale, lineHeight: 41.6 * scale }]}
        variant="headline-1"
        weight="semibold"
      >
        함께가길과 함께 가요
      </Text>
      <Text
        color={highContrast ? contrastPreview.body : colors.text.tertiary}
        style={[styles.previewBody, { fontSize: 20 * scale, lineHeight: 28 * scale }]}
        variant="title-2"
        weight="medium"
      >
        {'함께가길은 여러분이 가는\n길을 밝혀 나갑니다'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderColor: colors.border.regular,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing[5],
  },
  previewDisplay: {
    fontFamily: fontFamily.semibold,
  },
  previewTitle: {
    marginTop: spacing[1.5],
  },
  previewBody: {
    marginTop: spacing[2.5],
  },
});
