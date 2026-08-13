import { Image, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  loginAccessNotice,
  loginHeadline,
  SocialLoginButton,
  SOCIAL_PROVIDERS,
  type SocialProvider,
} from '@/components/auth';
import { loginLayout } from '@/components/auth/tokens';
import { Text } from '@/components/common/Text';
import { colors } from '@/styles/tokens/colors';

interface LoginScreenProps {
  readonly onProviderPress?: (provider: SocialProvider) => void;
}

export function LoginScreen({ onProviderPress }: LoginScreenProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const horizontalInset = width < loginLayout.compactBreakpoint
    ? loginLayout.compactHorizontalInset
    : loginLayout.referenceHorizontalInset;
  const brandTopPadding = Math.max(0, loginLayout.brandTopOffset - insets.top);
  const footerBottomPadding = Math.max(0, loginLayout.footerBottomOffset - insets.bottom);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.mobileFrame}>
        <View role="main" style={[styles.content, { paddingHorizontal: horizontalInset }]}>
          <View accessible accessibilityLabel="함께가길" accessibilityRole="image" style={[styles.brand, { paddingTop: brandTopPadding }]}>
            <Image resizeMode="contain" source={require('@/assets/logo-mark.png')} style={styles.mark} />
            <View style={styles.wordmarkFrame}>
              <Image resizeMode="contain" source={require('@/assets/logo-wordmark.png')} style={styles.wordmark} />
            </View>
          </View>

          <Text color={colors.text.disabled} style={styles.title} variant="title-2" weight="semibold">
            {loginHeadline}
          </Text>

          <View style={styles.providers}>
            {SOCIAL_PROVIDERS.map((provider, index) => (
              <View key={provider} style={index === 2 ? styles.lastProvider : null}>
                <SocialLoginButton onProviderPress={onProviderPress} provider={provider} />
              </View>
            ))}
          </View>

          <View style={styles.spacer} />

          <Text color={colors.text.disabled} style={[styles.footer, { paddingBottom: footerBottomPadding }]} variant="body-3">
            {loginAccessNotice}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  mobileFrame: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: loginLayout.maximumWidth,
    width: '100%',
  },
  content: {
    flex: 1,
  },
  brand: {
    alignItems: 'center',
  },
  mark: {
    height: loginLayout.logoMarkHeight,
    tintColor: colors.brand.mainAlt,
    width: loginLayout.logoMarkWidth,
  },
  wordmarkFrame: {
    alignItems: 'center',
    height: loginLayout.logoWordmarkFrameHeight,
    marginTop: loginLayout.logoGap,
  },
  wordmark: {
    height: loginLayout.logoWordmarkHeight,
    marginTop: loginLayout.logoWordmarkTopInset,
    tintColor: colors.brand.mainAlt,
    width: loginLayout.logoWordmarkWidth,
  },
  title: {
    marginTop: loginLayout.titleTopMargin,
    textAlign: 'center',
  },
  providers: {
    gap: loginLayout.providersFirstGap,
    marginTop: loginLayout.providersTopMargin,
  },
  lastProvider: {
    marginTop: loginLayout.providersSecondGap - loginLayout.providersFirstGap,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    textAlign: 'center',
  },
});
