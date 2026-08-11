import { useEffect } from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';

import { colors } from '@/styles/tokens/colors';

const SPLASH_DURATION_MS = 1600;

/** 워드마크는 Futura(상용)라 폰트 대신 Figma에서 뽑은 이미지를 씁니다. */
export function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View accessibilityLabel="함께가길" accessibilityRole="image" style={styles.screen}>
      <StatusBar barStyle="light-content" />
      { }
      <Image resizeMode="contain" source={require('../assets/logo-mark.png')} style={styles.mark} />
      <Image
        resizeMode="contain"
        source={require('../assets/logo-wordmark.png')}
        style={styles.wordmark}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: colors.brand.mainAlt,
    flex: 1,
    justifyContent: 'center',
  },
  /** 시안 기준 마크 70x51, 워드마크 136x44, 사이 간격 11 */
  mark: {
    height: 58,
    width: 73,
  },
  wordmark: {
    height: 28,
    marginTop: 11,
    width: 133,
  },
});
