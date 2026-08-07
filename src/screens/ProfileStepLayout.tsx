import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomBar, PrimaryButton, SecondaryButton, SkipLink } from "../components/Buttons";
import { ScreenHeader, StepProgress } from "../components/ScreenHeader";
import { colors, spacing, typography } from "../theme";

export const PROFILE_STEP_COUNT = 3;

type ProfileStepLayoutProps = {
  step: number;
  title: string;
  subtitle: string;
  nextLabel: string;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  children: React.ReactNode;
};

/** 프로필 설정 3단계가 공유하는 헤더 · 진행 바 · 하단 액션 레이아웃. */
export function ProfileStepLayout({
  step,
  title,
  subtitle,
  nextLabel,
  onBack,
  onNext,
  onSkip,
  children
}: ProfileStepLayoutProps) {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <ScreenHeader onBack={onBack} title="프로필 설정" />
      <StepProgress step={step} total={PROFILE_STEP_COUNT} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
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
    backgroundColor: colors.white,
    flex: 1
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: spacing.screenX,
    paddingTop: 16
  },
  title: {
    ...typography.screenTitle,
    color: colors.text
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: 8
  },
  actions: {
    flexDirection: "row",
    gap: 12
  },
  action: {
    flex: 1
  }
});
