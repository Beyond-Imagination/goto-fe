import { type ComponentType } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { AppRoute } from '@/navigation/routes';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';
import { fontFamily, fontSize } from '@/styles/tokens/typography';

type AppRouteScreenProps = {
  readonly route: Exclude<AppRoute, 'profile'>;
};

type PlaceholderScreenProps = {
  readonly description: string;
  readonly title: string;
};

// 내 정보(profile)는 app/(tabs)/profile/ 스택으로 분리되어 여기서 빠졌습니다.
const ROUTE_COMPONENTS = {
  home: HomeScreen,
  location: LocationScreen,
  report: ReportScreen,
  saved: SavedScreen
} as const satisfies Record<Exclude<AppRoute, 'profile'>, ComponentType>;

// TODO: 각각에 해당하는 화면으로 직접 라우팅 될 수 있게끔 수정 후 제거 예정
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
    paddingHorizontal: spacing[6]
  },
  placeholderTitle: {
    color: colors.text.primary,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['title-1'].fontSize,
    letterSpacing: fontSize['title-1'].letterSpacing,
    lineHeight: fontSize['title-1'].lineHeight
  },
  placeholderDescription: {
    color: colors.text.secondary,
    fontFamily: fontFamily.regular,
    fontSize: fontSize['body-2'].fontSize,
    letterSpacing: fontSize['body-2'].letterSpacing,
    lineHeight: fontSize['body-2'].lineHeight,
    marginTop: spacing[2],
    textAlign: "center"
  },
});
