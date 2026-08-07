import { useFonts } from "expo-font";
import { StatusBar, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RootNavigator } from "./src/navigation/RootNavigator";
import { ProfileProvider } from "./src/state/profile";
import { colors } from "./src/theme";

export default function App() {
  // 시안이 지정한 Pretendard(SIL OFL)를 번들해 씁니다.
  const [fontsLoaded] = useFonts({
    "Pretendard-Regular": require("pretendard/dist/public/static/alternative/Pretendard-Regular.ttf"),
    "Pretendard-Medium": require("pretendard/dist/public/static/alternative/Pretendard-Medium.ttf"),
    "Pretendard-SemiBold": require("pretendard/dist/public/static/alternative/Pretendard-SemiBold.ttf")
  });

  if (!fontsLoaded) {
    return <View style={{ backgroundColor: colors.primary, flex: 1 }} />;
  }

  return (
    <SafeAreaProvider>
      <ProfileProvider>
        {/* 스플래시만 밝은 아이콘을 쓰고, 나머지 흰 배경 화면은 어두운 아이콘으로 돌아옵니다. */}
        <StatusBar barStyle="dark-content" translucent />
        <RootNavigator />
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
