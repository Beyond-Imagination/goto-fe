import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Goto",
  slug: "goto-fe",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "goto",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "kr.bi.gotoapp"
  },
  android: {
    edgeToEdgeEnabled: true,
    package: "kr.bi.gotoapp"
  },
  web: {
    bundler: "metro"
  },
  plugins: [
    [
      "@mj-studio/react-native-naver-map",
      {
        client_id: process.env.NAVER_MAP_CLIENT_ID,
        ios: {
          NSLocationWhenInUseUsageDescription: "실내 지도에서 현재 위치를 표시하기 위해 위치 정보가 필요해요."
        },
        android: {
          ACCESS_FINE_LOCATION: true,
          ACCESS_COARSE_LOCATION: true
        }
      }
    ],
    [
      "expo-build-properties",
      {
        android: {
          extraMavenRepos: ["https://repository.map.naver.com/archive/maven"]
        }
      }
    ]
  ]
};

export default config;
