import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/session/AuthProvider';
import { Text } from '@/components/common/Text';
import { FigmaSvg } from '@/components/help/FigmaSvg';
import { HelpHeader } from '@/components/help/HelpHeader';
import { FIGMA_HELP_ASSETS } from '@/design/figmaHelpAssets';
import { getPendingHelpRequestApi, HELP_ROUTE, usePendingHelpRequestCount } from '@/help';
import { colors } from '@/styles/tokens/colors';
import { spacing } from '@/styles/tokens/spacing';

type HelpCardKind = 'nearby' | 'facility' | 'helpers';

type HelpCard = Readonly<{
  accessibilityLabel: string;
  description: string;
  href: (typeof HELP_ROUTE)[keyof typeof HELP_ROUTE];
  kind: HelpCardKind;
  title: string;
}>;

const HELP_CARDS = [
  {
    accessibilityLabel: '주변 사용자에게 도움 요청하기',
    description: '가까이 있는 사용자에게 실시간으로\n도움을 요청합니다.',
    href: HELP_ROUTE.requestNearby,
    kind: 'nearby',
    title: '주변 사용자에게 요청하기',
  },
  {
    accessibilityLabel: '시설 관리자 연락하기',
    description: '현재 위치한 시설의 관리자에게\n연락합니다.',
    href: HELP_ROUTE.contactFacility,
    kind: 'facility',
    title: '시설 관리자 연락',
  },
  {
    accessibilityLabel: '도움이 필요한 사람 찾기',
    description: '내 주변의 도움 요청을 지도에서\n확인합니다.',
    href: HELP_ROUTE.nearbyRequests,
    kind: 'helpers',
    title: '도움이 필요한 사람 찾기',
  },
] as const satisfies readonly HelpCard[];

export function HelpRequestHomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const pendingHelpRequestApi = useMemo(
    () =>
      getPendingHelpRequestApi(process.env.EXPO_PUBLIC_AUTH_MODE, {
        getAccessToken: () => session?.accessToken,
      }),
    [session?.accessToken],
  );
  const pendingCount = usePendingHelpRequestCount(pendingHelpRequestApi);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(tabs)');
  }

  return (
    <View style={styles.screen}>
      <HelpHeader onBack={handleBack} title="도움요청" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.intro}>
          <Text variant="headline-1" weight="semibold">
            도움이 필요하신가요?
          </Text>
          <Text color={colors.text.secondary} variant="body-1">
            상황에 맞는 도움을 요청해 보세요.
          </Text>
        </View>

        <HelpActionCard card={HELP_CARDS[0]} onPress={() => router.push(HELP_CARDS[0].href)} />
        <HelpActionCard card={HELP_CARDS[1]} onPress={() => router.push(HELP_CARDS[1].href)} />

        <View style={styles.emergencyNotice}>
          <FigmaSvg height={24} source={FIGMA_HELP_ASSETS.warning} width={24} />
          <Text color={colors.text.secondary} variant="body-1">
            긴급 상황은 119에 연락하세요
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHeading}>
          <Text variant="title-1" weight="semibold">
            여러분의 도움이 필요해요
          </Text>
          {pendingCount ? <PendingCountBadge count={pendingCount} /> : null}
        </View>

        <HelpActionCard card={HELP_CARDS[2]} onPress={() => router.push(HELP_CARDS[2].href)} />
      </ScrollView>
    </View>
  );
}

function HelpActionCard({ card, onPress }: { readonly card: HelpCard; readonly onPress: () => void }) {
  const isLight = card.kind === 'facility';

  return (
    <Pressable
      accessibilityLabel={card.accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        card.kind === 'nearby' ? styles.nearbyCard : null,
        card.kind === 'facility' ? styles.facilityCard : null,
        card.kind === 'helpers' ? styles.helpersCard : null,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <View pointerEvents="none" style={styles.cardCopy}>
        <Text color={isLight ? colors.text.primary : colors.text.inverse} variant="title-1" weight="semibold">
          {card.title}
        </Text>
        <Text color={isLight ? colors.text.primary : colors.text.inverse} style={styles.cardDescription} variant="body-3">
          {card.description}
        </Text>
      </View>

      <CardArtwork kind={card.kind} />

      <View pointerEvents="none" style={styles.cardArrow}>
        <FigmaSvg
          height={30}
          source={isLight ? FIGMA_HELP_ASSETS.arrowDark : FIGMA_HELP_ASSETS.arrowWhite}
          width={30}
        />
      </View>
    </Pressable>
  );
}

function CardArtwork({ kind }: { readonly kind: HelpCardKind }) {
  if (kind === 'nearby') {
    return (
      <View pointerEvents="none" style={styles.cardArtwork}>
        <CardDecoration kind="nearby" />
        <View style={styles.nearbyPeopleFade}>
          <FigmaSvg height={27.4248} source={FIGMA_HELP_ASSETS.nearbyPeopleFade} width={57.374} />
        </View>
        <View style={styles.artworkIcon}>
          <FigmaSvg height={28.6299} source={FIGMA_HELP_ASSETS.nearbyPeople} width={28.6289} />
        </View>
      </View>
    );
  }

  if (kind === 'facility') {
    return (
      <View pointerEvents="none" style={styles.cardArtwork}>
        <CardDecoration kind="facility" />
        <View style={[styles.artworkIcon, styles.facilityCall]}>
          <FigmaSvg height={31} source={FIGMA_HELP_ASSETS.call} width={32} />
        </View>
      </View>
    );
  }

  return (
    <View pointerEvents="none" style={styles.cardArtwork}>
      <CardDecoration kind="helpers" />
      <View style={styles.artworkIcon}>
        <FigmaSvg height={36.6299} source={FIGMA_HELP_ASSETS.helperPerson} width={36.6289} />
      </View>
    </View>
  );
}

function CardDecoration({ kind }: { readonly kind: HelpCardKind }) {
  return (
    <View style={styles.decoration}>
      <View style={[styles.decorationOuter, decorationFill[kind].outer]} />
      <View style={[styles.decorationInner, decorationFill[kind].inner]} />
    </View>
  );
}

function PendingCountBadge({ count }: { readonly count: number }) {
  return (
    <View style={styles.pendingBadge}>
      <Text color={colors.brand.help} variant="caption-2">
        지금 {count}건
      </Text>
      <View style={styles.pendingDot} />
    </View>
  );
}

const decorationFill = {
  facility: {
    inner: { backgroundColor: 'rgba(162, 162, 162, 0.098)' },
    outer: { backgroundColor: 'rgba(162, 162, 162, 0.07)' },
  },
  helpers: {
    inner: { backgroundColor: 'rgba(255, 255, 255, 0.098)' },
    outer: { backgroundColor: 'rgba(255, 255, 255, 0.098)' },
  },
  nearby: {
    inner: { backgroundColor: 'rgba(255, 255, 255, 0.098)' },
    outer: { backgroundColor: 'rgba(255, 255, 255, 0.049)' },
  },
} as const satisfies Record<HelpCardKind, { inner: { backgroundColor: string }; outer: { backgroundColor: string } }>;

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    height: 143,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  cardArrow: {
    position: 'absolute',
    right: spacing[5],
    top: 22,
  },
  cardArtwork: {
    height: 136,
    position: 'absolute',
    right: -17,
    top: 36,
    width: 136,
  },
  cardCopy: {
    left: spacing[5],
    position: 'absolute',
    top: spacing[5],
    zIndex: 1,
  },
  cardDescription: {
    marginTop: 2,
    width: 200,
  },
  cardPressed: {
    opacity: 0.82,
  },
  content: {
    alignSelf: 'center',
    flexGrow: 1,
    maxWidth: 430,
    paddingBottom: spacing[14],
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    width: '100%',
  },
  decoration: {
    height: 136,
    width: 136,
  },
  decorationInner: {
    borderRadius: 40,
    height: 80,
    left: 28,
    position: 'absolute',
    top: 28,
    width: 80,
  },
  decorationOuter: {
    borderRadius: 68,
    height: 136,
    position: 'absolute',
    width: 136,
  },
  divider: {
    backgroundColor: colors.border.regular,
    height: 1,
    marginTop: spacing[6],
    width: '100%',
  },
  emergencyNotice: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing[2.5],
    marginTop: spacing[6],
  },
  artworkIcon: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  facilityCall: {
    transform: [{ scaleX: -1 }],
  },
  facilityCard: {
    backgroundColor: colors.background.regular,
    marginTop: spacing[3],
  },
  helpersCard: {
    backgroundColor: colors.brand.help,
    marginTop: spacing[3],
  },
  intro: {
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  nearbyCard: {
    backgroundColor: colors.brand.mainAlt,
  },
  nearbyPeopleFade: {
    left: 39,
    position: 'absolute',
    top: 47,
  },
  pendingBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(249, 168, 37, 0.05)',
    borderColor: colors.brand.help,
    borderRadius: 100,
    borderWidth: 1,
    marginLeft: spacing[2.5],
    marginTop: 3,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    position: 'relative',
  },
  pendingDot: {
    backgroundColor: colors.semantic.danger.DEFAULT,
    borderRadius: 3,
    height: 6,
    position: 'absolute',
    right: -4,
    top: -4,
    width: 6,
  },
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: spacing[6],
  },
});
