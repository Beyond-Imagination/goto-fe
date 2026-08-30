import { StyleSheet, View } from 'react-native';

import { colors } from '@/styles/tokens/colors';

import { HELP_REQUEST_TOTAL_STEPS } from './tokens';

type HelpStepProgressProps = {
  /** 1부터 시작하는 현재 단계. */
  readonly step: number;
  readonly totalSteps?: number;
};

/** 도움 요청 단계 표시. 시안은 한 줄을 단계 수만큼 나눠 채웁니다. */
export function HelpStepProgress({ step, totalSteps = HELP_REQUEST_TOTAL_STEPS }: HelpStepProgressProps) {
  return (
    <View
      accessibilityLabel={`전체 ${totalSteps}단계 중 ${step}단계`}
      accessibilityRole="progressbar"
      style={styles.track}
    >
      {Array.from({ length: totalSteps }, (_, index) => (
        <View
          key={index}
          style={[styles.segment, index < step ? styles.segmentFilled : null]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 2,
  },
  segment: {
    backgroundColor: colors.background.regular,
    borderRadius: 2,
    flex: 1,
    height: 3,
  },
  segmentFilled: {
    backgroundColor: colors.brand.mainAlt,
  },
});
