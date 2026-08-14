import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';

import {
  ALL_AGREEMENT_MASK,
  hasRequiredAgreements,
  SIGNUP_AGREEMENTS,
  toggleAgreement,
} from '@/auth/signup/signupAgreements';
import { Text } from '@/components/common/Text';
import { SignupHeader, signupLayout } from '@/components/signup/SignupHeader';
import { BottomBar, PrimaryButton } from '@/components/onboarding/Buttons';
import { FIGMA_SIGNUP_ASSETS } from '@/design/figmaSignupAssets';
import { colors } from '@/styles/tokens/colors';
import { radius } from '@/styles/tokens/radius';
import { spacing } from '@/styles/tokens/spacing';

interface SignupTermsScreenProps {
  readonly initialAgreementMask?: number;
  readonly onBack: () => void;
  readonly onContinue: (agreementMask: number) => void;
}

export function SignupTermsScreen({
  initialAgreementMask = 0,
  onBack,
  onContinue,
}: SignupTermsScreenProps) {
  const [agreementMask, setAgreementMask] = useState(initialAgreementMask);
  const allChecked = agreementMask === ALL_AGREEMENT_MASK;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <SignupHeader onBack={onBack} title="약관 동의" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading} variant="headline-1" weight="semibold">
          약관에 동의해주세요
        </Text>
        <Text color={colors.text.secondary} style={styles.subtitle} variant="body-1">
          서비스 이용을 위해 아래 약관에 동의가 필요해요.
        </Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: allChecked }}
          onPress={() => setAgreementMask(allChecked ? 0 : ALL_AGREEMENT_MASK)}
          style={styles.allAgreement}
        >
          <AgreementCheck checked={allChecked} large />
          <View style={styles.allAgreementText}>
            <Text variant="body-2" weight="semibold">
              전체동의
            </Text>
            <Text color={colors.text.tertiary} style={styles.allAgreementDescription} variant="caption-1">
              선택 항목까지 모두 포함합니다.
            </Text>
          </View>
        </Pressable>

        <View style={styles.agreementList}>
          {SIGNUP_AGREEMENTS.map((agreement) => {
            const checked = Boolean(agreementMask & agreement.bit);

            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                key={agreement.id}
                onPress={() => setAgreementMask((mask) => toggleAgreement(mask, agreement.bit))}
                style={styles.agreementRow}
              >
                <AgreementCheck checked={checked} />
                <Text style={styles.agreementLabel} variant="body-2">
                  {agreement.label}
                </Text>
                <SvgUri height={10} style={styles.arrow} uri={FIGMA_SIGNUP_ASSETS.arrowRight} width={13} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.notice}>
          <SvgUri height={16} uri={FIGMA_SIGNUP_ASSETS.noticeMark} width={16} />
          <View style={styles.noticeText}>
            <Text color={colors.text.secondary} variant="caption-1">
              위치 정보는 접근성 정보를 찾는 데만 씁니다
            </Text>
            <Text color={colors.text.tertiary} style={styles.noticeDescription} variant="caption-1">
              주변 장소와 장애물 제보를 보여주기 위해 사용하고, 이동 경로를 저장하거나 제3자에게 제공하지 않습니다.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomBar horizontalPadding={signupLayout.horizontalPadding} showBorder={false}>
        <PrimaryButton
          disabled={!hasRequiredAgreements(agreementMask)}
          label="동의하고 계속하기"
          onPress={() => onContinue(agreementMask)}
          style={styles.continueButton}
        />
      </BottomBar>
    </SafeAreaView>
  );
}

function AgreementCheck({ checked, large = false }: { checked: boolean; large?: boolean }) {
  return (
    <View style={[styles.check, large ? styles.largeCheck : null]}>
      <SvgUri
        height={21.5}
        uri={checked ? FIGMA_SIGNUP_ASSETS.checkSelectedBackground : FIGMA_SIGNUP_ASSETS.checkDisabledBackground}
        width={21.5}
      />
      <SvgUri height={7.5} style={styles.checkIcon} uri={FIGMA_SIGNUP_ASSETS.icon01White} width={9.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing[12],
    paddingHorizontal: signupLayout.horizontalPadding,
    paddingTop: spacing[4],
  },
  heading: {
    marginTop: spacing[1],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  allAgreement: {
    alignItems: 'center',
    backgroundColor: colors.background.light,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: spacing[10],
    minHeight: 90,
    paddingHorizontal: spacing[5],
  },
  allAgreementText: {
    marginLeft: spacing[3],
  },
  allAgreementDescription: {
    marginTop: spacing[0.5],
  },
  agreementList: {
    gap: spacing[1],
    marginTop: spacing[5],
  },
  agreementRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
  },
  agreementLabel: {
    flex: 1,
    marginLeft: spacing[3],
  },
  arrow: {
    opacity: 0.55,
  },
  check: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    width: 24,
  },
  checkIcon: {
    position: 'absolute',
  },
  largeCheck: {
    height: 24,
    width: 24,
  },
  notice: {
    borderTopColor: colors.border.regular,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: spacing[5],
    paddingTop: spacing[5],
  },
  noticeText: {
    flex: 1,
    marginLeft: spacing[1],
  },
  noticeDescription: {
    marginTop: spacing[1],
  },
  continueButton: {
    borderRadius: radius.lg,
    height: 58,
  },
});
