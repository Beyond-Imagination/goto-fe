import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { useAuth } from '@/auth';
import { Text } from '@/components/common/Text';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import { toProfileSummary, useAsyncResource, useMyInfoApi } from '@/myinfo';
import { colors } from '@/styles/tokens/colors';

type MenuItem = {
  readonly icon: ImageSourcePropType;
  readonly label: string;
  /** (tabs)/profile 스택 안의 상대 경로. 없으면 아직 화면이 없는 항목입니다. */
  readonly href?: string;
};

const MENU_ITEMS: readonly MenuItem[] = [
  {
    icon: require('../../assets/icons/menu-accessibility.png'),
    label: '접근성 프로필',
    href: '/profile/accessibility',
  },
  {
    icon: require('../../assets/icons/menu-report-history.png'),
    label: '내 제보 기록',
    href: '/profile/reports',
  },
  {
    icon: require('../../assets/icons/menu-confirmed.png'),
    label: '내가 확인한 리포트',
    href: '/profile/confirmed',
  },
  // TODO: 저장 장소 화면은 저장 탭과 함께 정의될 예정이라 아직 연결하지 않았습니다.
  { icon: require('../../assets/icons/menu-saved.png'), label: '저장 장소' },
  {
    icon: require('../../assets/icons/menu-notification.png'),
    label: '알림 설정',
    href: '/profile/notifications',
  },
  {
    icon: require('../../assets/icons/menu-display.png'),
    label: '접근성 보기 설정',
    href: '/profile/view-settings',
  },
];

type MyInfoHomeScreenProps = {
  readonly onNavigate: (href: string) => void;
};

/** 내 정보 01 — 홈. 프로필 요약 + 활동 통계 + 메뉴 목록. */
export function MyInfoHomeScreen({ onNavigate }: MyInfoHomeScreenProps) {
  const { clearSession } = useAuth();
  const api = useMyInfoApi();
  const loadProfile = useCallback(() => api.getProfile(), [api]);
  const profile = useAsyncResource(loadProfile, '내 정보를 불러오지 못했어요. 다시 시도해주세요.');
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

  if (profile.state === 'loading') {
    return (
      <View style={styles.screen}>
        <MyInfoHeader title="내 정보" />
        <LoadingView message="내 정보를 불러오는 중입니다..." />
      </View>
    );
  }

  if (profile.state === 'error' || !profile.data) {
    return (
      <View style={styles.screen}>
        <MyInfoHeader title="내 정보" />
        <ErrorView
          message={profile.errorMessage ?? '내 정보를 불러오지 못했어요.'}
          onRetry={profile.reload}
        />
      </View>
    );
  }

  const { nickname, mobilityModes, stats } = profile.data;
  const statCards = [
    { label: '내제보', value: stats.reportCount, unit: '건' },
    { label: '도움 된 사람', value: stats.helpedPeopleCount, unit: '명' },
    { label: '해결 확인', value: stats.resolvedConfirmationCount, unit: '건' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.hero}>
        <MyInfoHeader title="내 정보" />
        <View style={styles.profileRow}>
          <View style={styles.profileText}>
            <View style={styles.nameRow}>
              <Text color={colors.text.primary} variant="headline-1" weight="semibold">
                {nickname}
              </Text>
              <Image source={require('../../assets/icons/chevron-right.png')} style={styles.nameChevron} />
            </View>
            <Text color={colors.text.tertiary} variant="body-1">
              {toProfileSummary(mobilityModes)}
            </Text>
          </View>
          {/* TODO(BE): 프로필 이미지 컬럼이 없어 기본 이미지를 씁니다. */}
          <Image source={require('../../assets/myinfo-avatar.png')} style={styles.avatar} />
        </View>
      </View>

      <View style={styles.stats}>
        {statCards.map(stat => (
          <View key={stat.label} style={styles.stat}>
            <View style={styles.statValueRow}>
              <Text color={colors.text.primary} variant="title-1" weight="semibold">
                {String(stat.value)}
              </Text>
              <Text color={colors.text.secondary} style={styles.statUnit} variant="body-3">
                {stat.unit}
              </Text>
            </View>
            <Text color={colors.text.disabled} variant="body-3">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.menu}>
        {MENU_ITEMS.map(item => (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="button"
            disabled={!item.href}
            key={item.label}
            onPress={item.href ? () => onNavigate(item.href!) : undefined}
            style={styles.menuRow}
          >
            <Image source={item.icon} style={styles.menuIcon} />
            <Text color={colors.text.secondary} style={styles.menuLabel} variant="body-1">
              {item.label}
            </Text>
            <Image source={require('../../assets/icons/chevron-right.png')} style={styles.menuChevron} />
          </Pressable>
        ))}
      </View>

      {/* 피그마 프레임에는 없지만, 기존 화면에 있던 로그아웃 동선을 유지하기 위해 남겨둔 버튼입니다. */}
      <Pressable
        accessibilityLabel="로그아웃"
        accessibilityRole="button"
        accessibilityState={{ disabled: isLoggingOut }}
        disabled={isLoggingOut}
        onPress={() => void logout()}
        style={styles.logout}
      >
        <Text color={colors.text.disabled} variant="body-3">
          {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
        </Text>
      </Pressable>
      {logoutError ? (
        <Text color={colors.semantic.danger.DEFAULT} style={styles.logoutError} variant="caption-1">
          {logoutError}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: colors.background.light,
    paddingBottom: 26,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 46,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  profileText: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  nameChevron: {
    height: 20,
    width: 20,
  },
  avatar: {
    borderRadius: 35,
    height: 70,
    width: 70,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 31,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statValueRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 4,
  },
  statUnit: {
    marginBottom: 2,
  },
  menu: {
    gap: 28,
    marginTop: 41,
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  menuIcon: {
    height: 24,
    width: 24,
  },
  menuLabel: {
    flex: 1,
  },
  menuChevron: {
    height: 20,
    width: 20,
  },
  logout: {
    alignSelf: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutError: {
    marginTop: 4,
    textAlign: 'center',
  },
});
