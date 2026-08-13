import { useState, type ComponentType } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from '@/auth';
import type { AppRoute } from '@/navigation/routes';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';
import { fontFamily, fontSize } from '@/styles/tokens/typography';

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

function ProfileScreen() {
  const { clearSession } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function logout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await clearSession();
    } catch {
      setLogoutError('로그아웃하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <View accessibilityLiveRegion="polite" role="main" style={styles.placeholder}>
      <Text aria-level={1} role="heading" style={styles.placeholderTitle}>
        내 정보
      </Text>
      <Text style={styles.placeholderDescription}>내 정보 화면은 곧 준비됩니다.</Text>
      <Pressable
        accessibilityLabel="로그아웃"
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoggingOut }}
        disabled={isLoggingOut}
        onPress={() => void logout()}
        style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutButtonPressed : null]}
      >
        <Text style={styles.logoutButtonLabel}>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</Text>
      </Pressable>
      {logoutError ? <Text style={styles.logoutError}>{logoutError}</Text> : null}
    </View>
  );
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
  logoutButton: {
    alignItems: 'center',
    borderColor: colors.border.regular,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing[6],
    minHeight: 44,
    paddingHorizontal: spacing[5],
  },
  logoutButtonPressed: {
    backgroundColor: colors.background.light,
  },
  logoutButtonLabel: {
    color: colors.text.secondary,
    fontFamily: fontFamily.medium,
    fontSize: fontSize['body-2'].fontSize,
    lineHeight: fontSize['body-2'].lineHeight,
  },
  logoutError: {
    color: colors.semantic.danger.DEFAULT,
    fontFamily: fontFamily.regular,
    fontSize: fontSize['body-3'].fontSize,
    lineHeight: fontSize['body-3'].lineHeight,
    marginTop: spacing[3],
    textAlign: 'center',
  }
});
