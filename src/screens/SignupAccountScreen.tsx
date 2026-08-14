import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgUri } from 'react-native-svg';

import { getNicknameFormatMessage, isValidNickname, normalizeNickname } from '@/auth/signup/nickname';
import { showProfilePhotoUnderDevelopmentAlert } from '@/auth/signup/profilePhotoAlert';
import { Text } from '@/components/common/Text';
import { SignupHeader, signupLayout } from '@/components/signup/SignupHeader';
import { BottomBar, PrimaryButton } from '@/components/onboarding/Buttons';
import { FIGMA_SIGNUP_ASSETS } from '@/design/figmaSignupAssets';
import { colors } from '@/styles/tokens/colors';
import { radius } from '@/styles/tokens/radius';
import { spacing } from '@/styles/tokens/spacing';
import { fontFamily } from '@/styles/tokens/typography';

type NicknameStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'unavailable'
  | 'invalid'
  | 'needsCheck'
  | 'requestFailed';

interface SignupAccountScreenProps {
  readonly initialNickname?: string;
  readonly initialNicknameUnavailable?: boolean;
  readonly onBack: () => void;
  readonly onCheckNickname: (nickname: string) => Promise<boolean>;
  readonly onContinue: (nickname: string) => void;
  readonly onPressProfileImage?: () => void;
}

export function SignupAccountScreen({
  initialNickname = '',
  initialNicknameUnavailable = false,
  onBack,
  onCheckNickname,
  onContinue,
  onPressProfileImage,
}: SignupAccountScreenProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [status, setStatus] = useState<NicknameStatus>(initialNicknameUnavailable ? 'unavailable' : 'idle');
  const normalizedNickname = normalizeNickname(nickname);

  async function checkNickname() {
    if (getNicknameFormatMessage(nickname)) {
      setStatus('invalid');
      return;
    }

    setStatus('checking');

    try {
      setStatus((await onCheckNickname(normalizedNickname)) ? 'available' : 'unavailable');
    } catch {
      setStatus('requestFailed');
    }
  }

  function submit() {
    if (!isValidNickname(nickname)) {
      setStatus('invalid');
      return;
    }

    if (status !== 'available') {
      setStatus('needsCheck');
      return;
    }

    onContinue(normalizedNickname);
  }

  const message = getStatusMessage(status);
  const lineStyle =
    status === 'unavailable' || status === 'invalid' ? styles.warningLine : status === 'available' ? styles.validLine : null;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <SignupHeader onBack={onBack} title="프로필 설정" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading} variant="headline-1" weight="semibold">
          어떻게 불러드릴까요?
        </Text>
        <Text color={colors.text.secondary} style={styles.subtitle} variant="body-1">
          닉네임과 프로필 사진을 설정해주세요.
        </Text>

        <Pressable
          accessibilityHint="프로필 사진을 변경하려면 누르세요."
          accessibilityLabel="프로필 사진 설정"
          accessibilityRole="button"
          onPress={onPressProfileImage ?? showProfilePhotoUnderDevelopmentAlert}
          style={({ pressed }) => [styles.avatar, pressed ? styles.avatarPressed : null]}
        >
          <SvgUri height={100} uri={FIGMA_SIGNUP_ASSETS.defaultAvatarBackground} width={100} />
          <SvgUri height={48} style={styles.avatarMark} uri={FIGMA_SIGNUP_ASSETS.defaultAvatarMark} width={60} />
          <SvgUri height={30} style={styles.avatarAdd} uri={FIGMA_SIGNUP_ASSETS.defaultAvatarAdd} width={30} />
        </Pressable>

        <View style={styles.nicknameLabel}>
          <Text variant="body-3">닉네임</Text>
          <Text color={colors.text.tertiary} variant="body-3">
            2~12자 · 한글, 영문, 숫자
          </Text>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            accessibilityLabel="닉네임"
            autoCapitalize="none"
            maxLength={12}
            onChangeText={(value) => {
              setNickname(value);
              setStatus('idle');
            }}
            placeholder="2글자 이상"
            placeholderTextColor={colors.text.tertiary}
            returnKeyType="done"
            style={styles.input}
            value={nickname}
          />
          <Pressable
            accessibilityRole="button"
            disabled={status === 'checking'}
            onPress={() => void checkNickname()}
            style={({ pressed }) => [styles.checkButton, pressed ? styles.checkButtonPressed : null]}
          >
            <Text variant="body-3">{status === 'checking' ? '확인 중' : '중복확인'}</Text>
          </Pressable>
        </View>
        <View style={[styles.inputLine, lineStyle]} />

        {message ? (
          <View style={styles.statusMessage}>
            {status === 'available' ? <StatusMark color={colors.brand.mainAlt} symbol="✓" /> : null}
            {status === 'unavailable' || status === 'invalid' ? <StatusMark color="#F9A825" symbol="!" /> : null}
            <Text color={getStatusColor(status)} variant="caption-1">
              {message}
            </Text>
          </View>
        ) : null}

        <View style={styles.notice}>
          <SvgUri height={16} uri={FIGMA_SIGNUP_ASSETS.noticeMark} width={16} />
          <View style={styles.noticeText}>
            <Text color={colors.text.secondary} variant="caption-1">
              닉네임은 내 제보에 함께 표시돼요
            </Text>
            <Text color={colors.text.tertiary} style={styles.noticeDescription} variant="caption-1">
              다른 사용자가 제보를 확인할 때 보입니다. 실명이나 연락처는 공개되지 않습니다.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomBar horizontalPadding={signupLayout.horizontalPadding} showBorder={false}>
        <PrimaryButton label="다음" onPress={submit} style={styles.continueButton} />
      </BottomBar>
    </SafeAreaView>
  );
}

function StatusMark({ color, symbol }: { color: string; symbol: string }) {
  return (
    <View style={[styles.statusMark, { borderColor: color }]}>
      <Text color={color} style={styles.statusMarkText} variant="caption-1" weight="semibold">
        {symbol}
      </Text>
    </View>
  );
}

function getStatusMessage(status: NicknameStatus): string | null {
  switch (status) {
    case 'available':
      return '사용할 수 있는 닉네임이에요';
    case 'unavailable':
      return '이미 사용중인 닉네임 이에요';
    case 'invalid':
      return '닉네임은 한글, 영문, 숫자 2~12자로 입력해주세요.';
    case 'needsCheck':
      return '중복확인을 해주세요.';
    case 'requestFailed':
      return '중복확인에 실패했어요. 다시 시도해주세요.';
    case 'idle':
    case 'checking':
      return null;
  }
}

function getStatusColor(status: NicknameStatus): string {
  if (status === 'available') {
    return colors.brand.mainAlt;
  }

  if (status === 'unavailable' || status === 'invalid') {
    return '#F9A825';
  }

  return colors.semantic.danger.DEFAULT;
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing[4],
    paddingHorizontal: signupLayout.horizontalPadding,
    paddingTop: spacing[4],
  },
  heading: {
    marginTop: spacing[1],
  },
  subtitle: {
    marginTop: spacing[2],
  },
  avatar: {
    alignSelf: 'center',
    height: 100,
    marginTop: spacing[12],
    position: 'relative',
    width: 100,
  },
  avatarPressed: {
    opacity: 0.82,
  },
  avatarMark: {
    left: 20,
    position: 'absolute',
    top: 26,
  },
  avatarAdd: {
    bottom: 0,
    position: 'absolute',
    right: -15,
  },
  nicknameLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[6],
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing[1],
  },
  input: {
    color: colors.text.primary,
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: 24,
    height: 44,
    letterSpacing: -0.6,
    padding: 0,
  },
  checkButton: {
    alignItems: 'center',
    backgroundColor: colors.background.light,
    borderRadius: radius.sm + 1,
    height: 38,
    justifyContent: 'center',
    marginLeft: spacing[2],
    width: 84,
  },
  checkButtonPressed: {
    opacity: 0.72,
  },
  inputLine: {
    backgroundColor: colors.border.regular,
    height: 1,
  },
  validLine: {
    backgroundColor: colors.text.primary,
  },
  warningLine: {
    backgroundColor: '#F9A825',
  },
  statusMessage: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  statusMark: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    height: 14,
    justifyContent: 'center',
    width: 14,
  },
  statusMarkText: {
    lineHeight: 14,
  },
  notice: {
    borderTopColor: colors.border.regular,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginTop: 'auto',
    paddingTop: spacing[4],
  },
  noticeText: {
    flex: 1,
    marginLeft: spacing[1],
  },
  noticeDescription: {
    marginTop: spacing[1],
  },
  continueButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    gap: 6,
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
});
