import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';

import {
  ALL_AGREEMENT_MASK,
  fetchTermsList,
  hasRequiredAgreements,
  SIGNUP_AGREEMENTS,
  type TermDetail,
  toggleAgreement,
} from '@/auth/signup';
import { Text } from '@/components/common/Text';
import { SignupHeader, signupLayout } from '@/components/signup/SignupHeader';
import { TermsDetailModal } from '@/components/signup/TermsDetailModal';
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

type LoadState = 'loading' | 'success' | 'error';

export function SignupTermsScreen({
  initialAgreementMask = 0,
  onBack,
  onContinue,
}: SignupTermsScreenProps) {
  const [agreementMask, setAgreementMask] = useState(initialAgreementMask);
  const [selectedTerm, setSelectedTerm] = useState<TermDetail | null>(null);
  const [termsMap, setTermsMap] = useState<Record<string, TermDetail>>({});
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allChecked = agreementMask === ALL_AGREEMENT_MASK;

  const loadTerms = useCallback(async () => {
    setLoadState('loading');
    setErrorMessage(null);

    try {
      const serverTerms = await fetchTermsList();
      const mapped: Record<string, TermDetail> = {};
      for (const term of serverTerms) {
        mapped[term.id] = term;
      }
      setTermsMap(mapped);
      setLoadState('success');
    } catch (error) {
      setLoadState('error');
      setErrorMessage(
        error instanceof Error ? error.message : '약관 정보를 불러오지 못했습니다. 다시 시도해주세요.',
      );
    }
  }, []);

  useEffect(() => {
    void loadTerms();
  }, [loadTerms]);

  function openTermModal(agreementId: string) {
    const detail = termsMap[agreementId];
    if (detail) {
      setSelectedTerm(detail);
    }
  }

  function handleAgreeTerm(term: TermDetail) {
    setAgreementMask((mask) => mask | term.bit);
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <SignupHeader onBack={onBack} title="약관 동의" />

      {loadState === 'loading' ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.brand.mainAlt} size="large" />
          <Text color={colors.text.tertiary} style={styles.loadingText} variant="body-3">
            약관 정보를 불러오는 중입니다...
          </Text>
        </View>
      ) : loadState === 'error' ? (
        <View style={styles.centerContainer}>
          <Text color={colors.semantic.danger.DEFAULT} style={styles.errorText} variant="body-2">
            {errorMessage ?? '약관 정보를 불러오지 못했습니다.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadTerms()}
            style={styles.retryButton}
          >
            <Text color={colors.text.primary} variant="body-3" weight="semibold">
              다시 시도
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
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
                const detail = termsMap[agreement.id];
                const displayLabel = detail ? `${detail.required ? '(필수)' : '(선택)'} ${detail.title}` : agreement.label;

                return (
                  <View key={agreement.id} style={styles.agreementRow}>
                    <Pressable
                      accessibilityLabel={`${displayLabel} 동의`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      hitSlop={8}
                      onPress={() => setAgreementMask((mask) => toggleAgreement(mask, agreement.bit))}
                      style={styles.checkboxTouch}
                    >
                      <AgreementCheck checked={checked} />
                    </Pressable>

                    <Pressable
                      accessibilityHint="약관 상세 내용을 모달로 확인합니다."
                      accessibilityRole="button"
                      onPress={() => openTermModal(agreement.id)}
                      style={styles.agreementLabelPressable}
                    >
                      <Text style={styles.agreementLabel} variant="body-2">
                        {displayLabel}
                      </Text>
                      <View hitSlop={8} style={styles.arrowContainer}>
                        <SvgUri height={14} style={styles.arrow} uri={FIGMA_SIGNUP_ASSETS.chevronRight} width={8} />
                      </View>
                    </Pressable>
                  </View>
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

          <TermsDetailModal
            isAgreed={Boolean(selectedTerm && agreementMask & selectedTerm.bit)}
            onAgree={handleAgreeTerm}
            onClose={() => setSelectedTerm(null)}
            term={selectedTerm}
            visible={selectedTerm !== null}
          />
        </>
      )}
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
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    gap: spacing[4],
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },
  loadingText: {
    marginTop: spacing[2],
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.background.light,
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[5],
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
  checkboxTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 32,
  },
  agreementLabelPressable: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingLeft: spacing[3],
  },
  agreementLabel: {
    flex: 1,
  },
  arrowContainer: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 24,
  },
  arrow: {
    opacity: 0.8,
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
