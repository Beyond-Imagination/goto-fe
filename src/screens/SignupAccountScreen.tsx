import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALL_AGREEMENT_MASK, hasRequiredAgreements, SIGNUP_AGREEMENTS, toggleAgreement } from '@/auth/signup/signupAgreements';
import type { OAuthSignupDetails } from '@/auth/common/types';
import { Text } from '@/components/common/Text';
import { BottomBar, PrimaryButton } from '@/components/onboarding/Buttons';
import { ScreenHeader } from '@/components/onboarding/ScreenHeader';
import { SCREEN_X } from '@/components/onboarding/tokens';
import { colors } from '@/styles/tokens/colors';
import { radius } from '@/styles/tokens/radius';
import { spacing } from '@/styles/tokens/spacing';
import { fontFamily } from '@/styles/tokens/typography';

interface SignupAccountScreenProps {
  readonly initialNickname?: string;
  readonly initialAgreementMask?: number;
  readonly onBack: () => void;
  readonly onContinue: (details: OAuthSignupDetails) => void;
  readonly errorMessage?: string | null;
}

export function SignupAccountScreen({
  initialNickname = '',
  initialAgreementMask = 0,
  onBack,
  onContinue,
  errorMessage = null,
}: SignupAccountScreenProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [agreementMask, setAgreementMask] = useState(initialAgreementMask);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const isValid = nickname.trim().length > 0 && hasRequiredAgreements(agreementMask);

  function submit() {
    const normalizedNickname = nickname.trim();

    if (!normalizedNickname) {
      setValidationMessage('닉네임을 입력해주세요.');
      return;
    }

    if (!hasRequiredAgreements(agreementMask)) {
      setValidationMessage('필수 약관에 모두 동의해주세요.');
      return;
    }

    setValidationMessage(null);
    onContinue({ nickname: normalizedNickname, agreementMask });
  }

  const message = validationMessage ?? errorMessage;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScreenHeader onBack={onBack} title="회원가입" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headline-1" weight="semibold">
          가입 정보를 입력해주세요
        </Text>
        <Text color={colors.text.secondary} style={styles.subtitle} variant="body-1">
          닉네임과 필수 약관 동의가 필요해요.
        </Text>

        <Text style={styles.label} variant="body-2" weight="semibold">
          닉네임
        </Text>
        <TextInput
          accessibilityLabel="닉네임"
          autoCapitalize="none"
          onChangeText={(value) => {
            setNickname(value);
            setValidationMessage(null);
          }}
          placeholder="닉네임을 입력해주세요"
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="done"
          style={styles.input}
          value={nickname}
        />

        <View style={styles.agreementHeader}>
          <Text variant="body-2" weight="semibold">
            약관 동의
          </Text>
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreementMask === ALL_AGREEMENT_MASK }}
            onPress={() => setAgreementMask((mask) => (mask === ALL_AGREEMENT_MASK ? 0 : ALL_AGREEMENT_MASK))}
            style={styles.allAgreement}
          >
            <Checkmark checked={agreementMask === ALL_AGREEMENT_MASK} />
            <Text variant="body-3" weight="semibold">
              모두 동의
            </Text>
          </Pressable>
        </View>

        <View style={styles.agreementList}>
          {SIGNUP_AGREEMENTS.map((agreement) => {
            const checked = Boolean(agreementMask & agreement.bit);

            return (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                key={agreement.id}
                onPress={() => {
                  setAgreementMask((mask) => toggleAgreement(mask, agreement.bit));
                  setValidationMessage(null);
                }}
                style={styles.agreementRow}
              >
                <Checkmark checked={checked} />
                <Text color={colors.text.secondary} style={styles.agreementLabel} variant="body-3">
                  {agreement.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {message ? (
          <Text accessibilityLiveRegion="polite" color={colors.semantic.danger.DEFAULT} style={styles.error} variant="body-3">
            {message}
          </Text>
        ) : null}
      </ScrollView>

      <BottomBar>
        <PrimaryButton disabled={!isValid} label="다음" onPress={submit} />
      </BottomBar>
    </SafeAreaView>
  );
}

function Checkmark({ checked }: { checked: boolean }) {
  return (
    <View style={[styles.checkmark, checked ? styles.checked : null]}>
      <Text color={checked ? colors.text.inverse : colors.text.tertiary} variant="body-3" weight="semibold">
        ✓
      </Text>
    </View>
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
  label: {
    marginTop: spacing[8],
  },
  input: {
    borderColor: colors.border.regular,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text.primary,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  agreementHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[8],
  },
  allAgreement: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    padding: spacing[1],
  },
  agreementList: {
    borderTopColor: colors.border.regular,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[4],
    marginTop: spacing[3],
    paddingTop: spacing[4],
  },
  agreementRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[3],
  },
  agreementLabel: {
    flex: 1,
  },
  checkmark: {
    alignItems: 'center',
    borderColor: colors.border.strong,
    borderRadius: radius.xs,
    borderWidth: 1,
    height: spacing[5],
    justifyContent: 'center',
    width: spacing[5],
  },
  checked: {
    backgroundColor: colors.brand.mainAlt,
    borderColor: colors.brand.mainAlt,
  },
  error: {
    marginTop: spacing[4],
  },
});
