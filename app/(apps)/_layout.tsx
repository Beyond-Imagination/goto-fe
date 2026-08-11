import { Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavigation } from '@/components/BottomNavigation';
import { APP_ROUTE, type AppRoute } from '@/navigation/routes';
import { colors } from '@/styles/tokens/colors';

export default function AppsLayout() {
  const activeScreen = getActiveScreen(usePathname());

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <Stack screenOptions={{ animation: 'none', headerShown: false }} />
        <BottomNavigation activeScreen={activeScreen} />
      </View>
    </SafeAreaView>
  );
}

function getActiveScreen(pathname: string): AppRoute {
  switch (pathname) {
    case '/':
      return APP_ROUTE.home;
    case '/location':
      return APP_ROUTE.location;
    case '/report':
      return APP_ROUTE.report;
    case '/saved':
      return APP_ROUTE.saved;
    case '/profile':
      return APP_ROUTE.profile;
    default:
      return APP_ROUTE.home;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
});
