import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNavigation } from '@/components/gnb';
import { colors } from '@/styles/tokens/colors';

export default function TabsLayout() {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <Tabs
          screenOptions={{ animation: 'none', headerShown: false }}
          tabBar={({ state }) => <BottomNavigation state={state} />}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="report" />
          <Tabs.Screen name="saved" />
          <Tabs.Screen name="profile" />
          <Tabs.Screen name="location" />
        </Tabs>
      </View>
    </SafeAreaView>
  );
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
