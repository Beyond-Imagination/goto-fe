import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Text } from '@/components/common/Text';
import { HELP_SCREEN_X, HelpHeader, HelpMapPlaceholder, HelpTag } from '@/components/help';
import {
  formatDistance,
  formatElapsed,
  formatHelpKinds,
  getCurrentCoordinates,
  isUrgentRemaining,
  useHelpRequestApi,
  type Coordinates,
  type NearbyHelpRequestResponse,
} from '@/help';
import { FALLBACK_COORDINATES } from '@/help';
import { colors } from '@/styles/tokens/colors';

/** BE nearby의 radiusMeters 상한은 5000m입니다. */
const NEARBY_RADIUS_METERS = 1000;

type NearbyHelpRequestsScreenProps = {
  readonly onBack: () => void;
  readonly onSelect: (helpRequestId: string) => void;
};

/** 도우미 01 — 주변 도움 요청 찾기. */
export function NearbyHelpRequestsScreen({ onBack, onSelect }: NearbyHelpRequestsScreenProps) {
  const insets = useSafeAreaInsets();
  const helpApi = useHelpRequestApi();

  const [coordinates, setCoordinates] = useState<Coordinates>(FALLBACK_COORDINATES);
  const [requests, setRequests] = useState<readonly NearbyHelpRequestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        setIsLoading(true);
        setLoadError(null);

        try {
          const current = await getCurrentCoordinates();
          const response = await helpApi.findNearby({
            latitude: current.latitude,
            longitude: current.longitude,
            radiusMeters: NEARBY_RADIUS_METERS,
          });

          if (!isActive) {
            return;
          }

          setCoordinates(current);
          setRequests(response);
        } catch {
          if (isActive) {
            setLoadError('주변 도움 요청을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void load();

      return () => {
        isActive = false;
      };
    }, [helpApi]),
  );

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="도움 주기" />

      <View>
        <HelpMapPlaceholder coordinates={coordinates} height={300} style={styles.map} />
        <View style={styles.countBadge}>
          <Text color={colors.text.primary} variant="body-1" weight="medium">
            {requests.length}건
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Text color={colors.text.primary} variant="title-2" weight="semibold">
          내 주변 도움 요청{' '}
          <Text color={colors.brand.mainAlt} variant="title-2" weight="semibold">
            {requests.length}건
          </Text>
        </Text>

        {isLoading ? <ActivityIndicator color={colors.brand.mainAlt} style={styles.loading} /> : null}

        {loadError ? (
          <Text color={colors.semantic.danger.DEFAULT} variant="body-3">
            {loadError}
          </Text>
        ) : null}

        {!isLoading && !loadError && requests.length === 0 ? (
          <Text color={colors.text.secondary} variant="body-3">
            지금은 주변에 도움 요청이 없어요.
          </Text>
        ) : null}

        {requests.map(request => (
            <Pressable
              accessibilityLabel={`${formatHelpKinds(request.kinds)} 요청 상세 보기`}
              accessibilityRole="button"
              key={request.id}
              onPress={() => onSelect(request.id)}
              style={styles.card}
            >
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text color={colors.text.primary} variant="body-1" weight="semibold">
                    {formatHelpKinds(request.kinds)}
                  </Text>
                  <HelpTag
                    label={formatElapsed(request.requestedAt)}
                    tone={isUrgentRemaining(request.expiresAt) ? 'urgent' : 'soon'}
                  />
                  <HelpTag label={formatDistance(request.distanceMeters)} tone="distance" />
                </View>
                <Text color={colors.text.secondary} numberOfLines={1} variant="body-3">
                  📍 {request.locationLabel}
                </Text>
              </View>

              <Text color={colors.icon.primary} variant="body-2">
                ›
              </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  map: {
    borderRadius: 0,
    borderWidth: 0,
  },
  countBadge: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    right: 20,
    top: 20,
  },
  content: {
    gap: 12,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 24,
  },
  loading: {
    marginVertical: 16,
  },
  card: {
    alignItems: 'center',
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
