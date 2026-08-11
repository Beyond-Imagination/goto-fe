import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import {
  BottomBar,
  PrimaryButton,
  SecondaryButton,
  SkipLink,
} from '@/components/onboarding/Buttons';
import { ScreenHeader, StepProgress } from '@/components/onboarding/ScreenHeader';
import { SCREEN_X } from '@/components/onboarding/tokens';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

export const PROFILE_STEP_COUNT = 3;

interface ProfileStepLayoutProps {
  step: number;
  title: string;
  subtitle: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  children: React.ReactNode;
}

/** 프로필 설정 3단계가 공유하는 헤더 · 진행 바 · 하단 액션 레이아웃. */
export function ProfileStepLayout({
  step,
  title,
  subtitle,
  nextLabel,
  onBack,
  onNext,
  onSkip,
  children,
}: ProfileStepLayoutProps) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScreenHeader onBack={onBack} title="프로필 설정" />
      <StepProgress step={step} total={PROFILE_STEP_COUNT} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headline-1" weight="semibold">
          {title}
        </Text>
        <Text color={colors.text.secondary} style={styles.subtitle} variant="body-1">
          {subtitle}
        </Text>
        {children}
      </ScrollView>

      <BottomBar>
        <View style={styles.actions}>
          <SecondaryButton label="이전" onPress={onBack} style={styles.action} />
          <PrimaryButton label={nextLabel} onPress={onNext} style={styles.action} />
        </View>
        <SkipLink onPress={onSkip} />
      </BottomBar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    paddingBottom: spacing[8],
    paddingHorizontal: SCREEN_X,
    paddingTop: spacing[4],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  action: {
    flex: 1,
  },
});
