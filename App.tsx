import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "./src/components/BottomNavigation";
import { FIGMA_TOKENS } from "./src/design/tokens";
import { type AppRoute } from "./src/navigation/routes";
import { AppRouteScreen } from "./src/screens/AppRouteScreen";

export default function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>("home");

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
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
    flex: 1
  },
  screen: {
    backgroundColor: FIGMA_TOKENS.canvas,
    flex: 1
  }
});
