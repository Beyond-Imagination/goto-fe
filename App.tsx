import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavigation } from './src/components/BottomNavigation';
import { FIGMA_TOKENS } from './src/design/tokens';
import { type AppRoute } from './src/navigation/routes';
import { AppRouteScreen } from './src/screens/AppRouteScreen';

void SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular': require('./src/assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium': require('./src/assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('./src/assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('./src/assets/fonts/Pretendard-Bold.otf'),
  });
  const [activeRoute, setActiveRoute] = useState<AppRoute>('home');

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

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.screen}>
          <AppRouteScreen route={activeRoute} />

          <BottomNavigation activeScreen={activeRoute} onNavigate={setActiveRoute} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: FIGMA_TOKENS.canvas,
    flex: 1,
  },
  screen: {
    backgroundColor: FIGMA_TOKENS.canvas,
    flex: 1,
  },
});
