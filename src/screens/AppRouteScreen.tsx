import type { ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { AppRoute } from "../navigation/routes";
import { FIGMA_TOKENS } from "../design/tokens";

type AppRouteScreenProps = {
  readonly route: AppRoute;
};

type PlaceholderScreenProps = {
  readonly description: string;
  readonly title: string;
};

const ROUTE_COMPONENTS = {
  home: HomeScreen,
  location: LocationScreen,
  profile: ProfileScreen,
  report: ReportScreen,
  saved: SavedScreen
} as const satisfies Record<AppRoute, ComponentType>;

export function AppRouteScreen({ route }: AppRouteScreenProps) {
  const Screen = ROUTE_COMPONENTS[route];

  return <Screen />;
}

function HomeScreen() {
  return <PlaceholderScreen description="메인 콘텐츠는 곧 준비됩니다." title="홈" />;
}

function ReportScreen() {
  return <PlaceholderScreen description="제보 화면은 곧 준비됩니다." title="제보" />;
}

function LocationScreen() {
  return <PlaceholderScreen description="추후 위치 기반 액션이 연결될 화면입니다." title="위치" />;
}

function SavedScreen() {
  return <PlaceholderScreen description="저장한 항목은 곧 확인할 수 있습니다." title="저장" />;
}

function ProfileScreen() {
  return <PlaceholderScreen description="내 정보 화면은 곧 준비됩니다." title="내 정보" />;
}

function PlaceholderScreen({ description, title }: PlaceholderScreenProps) {
  return (
    <View accessibilityLiveRegion="polite" role="main" style={styles.placeholder}>
      <Text aria-level={1} role="heading" style={styles.placeholderTitle}>
        {title}
      </Text>
      <Text style={styles.placeholderDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24
  },
  placeholderTitle: {
    color: FIGMA_TOKENS.labelPrimary,
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 32
  },
  placeholderDescription: {
    color: FIGMA_TOKENS.labelSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    textAlign: "center"
  }
});
