import { useEffect, useState } from 'react';
import * as Sentry from '@sentry/react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthResult, login, refresh } from '@/authApi';
import { Button, Card, Icon, IconName, Text } from '@/components';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

type RequestState = 'idle' | 'loading';

const ALL_ICONS: { name: IconName; label: string }[] = [
  { name: '긴보행거리', label: '긴보행거리' },
  { name: '계단', label: '계단' },
  { name: '공사구간', label: '공사구간' },
  { name: '높은턱', label: '높은턱' },
  { name: '보도파손', label: '보도파손' },
  { name: '급경사', label: '급경사' },
  { name: '좁은통로', label: '좁은통로' },
];

void SplashScreen.preventAutoHideAsync();

export default function App() {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular': require('./src/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./src/assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./src/assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./src/assets/fonts/Pretendard-Bold.otf'),
  });
  /* eslint-enable @typescript-eslint/no-require-imports */
  const [requestState, setRequestState] = useState<RequestState>('idle');
  const [result, setResult] = useState<AuthResult | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = requestState === 'loading';

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (fontError) {
    throw fontError;
  }

  async function handleLogin() {
    await runAuthRequest(async () => {
      const nextResult = await login();

      if (nextResult.type === 'login') {
        setRefreshToken(nextResult.response.refreshToken);
      }

      return nextResult;
    });
  }

  async function handleRefresh() {
    if (!refreshToken) {
      return;
    }

    await runAuthRequest(() => refresh(refreshToken));
  }

  async function runAuthRequest(request: () => Promise<AuthResult>) {
    setRequestState('loading');
    setErrorMessage(null);

    try {
      setResult(await request());
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          operation: "auth-request"
        }
      });
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setRequestState('idle');
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.light }}>
        <ScrollView contentContainerStyle={{ padding: spacing[5], gap: spacing[4] }}>
          <View style={{ gap: spacing[1] }}>
            <Text variant="headline-1" weight="bold" color={colors.brand.main}>
              함께가길 디자인 시스템 (Figma Nodes 8-4756 & 31-5393)
            </Text>
            <Text variant="body-2" color={colors.text.secondary}>
              Figma Variables, Styleguide & Component 아이콘 100% 반영
            </Text>
          </View>

          {/* 피그마 Component 아이콘 7종 세트 */}
          <Card elevation="sm">
            <Text variant="title-2" weight="semibold" style={{ marginBottom: spacing[3] }}>
              피그마 Component 아이콘 (7종)
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing[3], flexWrap: 'wrap' }}>
              {ALL_ICONS.map((item) => (
                <View
                  key={item.name}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: spacing[3],
                    backgroundColor: colors.background.regular,
                    borderRadius: 8,
                    minWidth: 80,
                    gap: spacing[2],
                  }}
                >
                  <Icon name={item.name} size={28} color={colors.brand.sub2} />
                  <Text variant="caption-2" weight="medium" color={colors.text.primary}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* 피그마 실제 컬러 팔레트 (Sub 02 #FFD000 검증) */}
          <Card elevation="sm">
            <Text variant="title-2" weight="semibold" style={{ marginBottom: spacing[3] }}>
              Figma Color Variables (Sub 02: #FFD000)
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
              <ColorChip name="Main 01" bg={colors.brand.main} text="#FFF" sub="#2962FF" />
              <ColorChip name="Sub 01" bg={colors.brand.sub1} text="#FFF" sub="#6200EA" />
              <ColorChip name="Sub 02" bg={colors.brand.sub2} text="#111" sub="#FFD000" />
              <ColorChip name="Text 01" bg={colors.text.primary} text="#FFF" sub="#111111" />
              <ColorChip name="Text 03" bg={colors.text.secondary} text="#FFF" sub="#505050" />
              <ColorChip name="Text 04" bg={colors.text.tertiary} text="#FFF" sub="#767676" />
              <ColorChip name="Text 05" bg={colors.text.disabled} text="#FFF" sub="#999999" />
              <ColorChip name="Icon 01" bg={colors.icon.primary} text="#FFF" sub="#2A2A37" />
              <ColorChip name="Line Regular" bg={colors.border.regular} text="#111" sub="#E5E5EC" />
            </View>
          </Card>

          {/* 인증 API 연동 카드 */}
          <Card elevation="sm">
            <Text variant="title-2" weight="semibold" style={{ marginBottom: spacing[3] }}>
              인증 API 연동 테스트
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing[2] }}>
              <Button
                label="로그인"
                variant="primary"
                loading={isLoading}
                disabled={isLoading}
                onPress={handleLogin}
              />
              {refreshToken ? (
                <Button
                  label="토큰 리프레시"
                  variant="secondary"
                  loading={isLoading}
                  disabled={isLoading}
                  onPress={handleRefresh}
                />
              ) : null}
            </View>

            {errorMessage || result ? (
              <View
                style={{
                  marginTop: spacing[4],
                  padding: spacing[3],
                  backgroundColor: colors.background.regular,
                  borderRadius: 8,
                }}
              >
                {errorMessage ? (
                  <Text variant="caption-1" color={colors.semantic.danger.DEFAULT}>
                    {errorMessage}
                  </Text>
                ) : null}

                {result ? (
                  <Text variant="caption-1" color={colors.text.primary}>
                    {JSON.stringify(result, null, 2)}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Card>

          {/* 피그마 실제 타이포그래피 스케일 */}
          <Card elevation="sm">
            <Text variant="title-2" weight="semibold" style={{ marginBottom: spacing[3] }}>
              Figma 01. Typography Guide (Pretendard)
            </Text>
            <View style={{ gap: spacing[2] }}>
              <Text variant="headline-1" weight="bold">
                Headline 1 (32px / 41.6px)
              </Text>
              <Text variant="title-1" weight="semibold" color={colors.brand.main}>
                Title 1 (24px / 33.6px)
              </Text>
              <Text variant="body-1" weight="medium">
                Body 1 (18px / 26.1px) - 함께가길 국문 영문 폰트
              </Text>
              <Text variant="body-2" color={colors.text.secondary}>
                Body 2 (16px / 23.2px) - 서브 텍스트 컬러 #505050
              </Text>
              <Text variant="caption-1" color={colors.text.tertiary}>
                Caption 1 (13px / 18.85px) - 캡션 텍스트 #767676
              </Text>
            </View>
          </Card>

          {/* 피그마 공통 버튼 variants */}
          <Card elevation="sm">
            <Text variant="title-2" weight="semibold" style={{ marginBottom: spacing[3] }}>
              공통 버튼 variants
            </Text>
            <View style={{ gap: spacing[2] }}>
              <Button label="Primary Button (#2962FF)" variant="primary" />
              <Button label="Secondary Button (#6200EA)" variant="secondary" />
              <Button label="Outline Button (#E5E5EC Border)" variant="outline" />
              <Button label="Disabled Button (#999999)" disabled variant="primary" />
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function ColorChip({
  name,
  bg,
  text,
  sub,
}: {
  name: string;
  bg: string;
  text: string;
  sub: string;
}) {
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
        borderWidth: bg === '#FFFFFF' ? 1 : 0,
        borderColor: colors.border.regular,
      }}
    >
      <Text variant="caption-1" weight="semibold" color={text}>
        {name}
      </Text>
      <Text variant="caption-3" color={text} style={{ opacity: 0.85 }}>
        {sub}
      </Text>
    </View>
  );
}
