import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Text } from '@/components/common/Text';
import {
  ContactMethodRow,
  EmergencyCallNotice,
  HELP_SCREEN_X,
  HelpHeader,
  HelpMapPlaceholder,
  HelpNoticeBox,
  PlaceSelectCard,
} from '@/components/help';
import {
  FALLBACK_COORDINATES,
  getCurrentCoordinates,
  useHelpRequestApi,
  type Coordinates,
  type PlaceContactResponse,
} from '@/help';
import { colors } from '@/styles/tokens/colors';

/** 처음에는 3곳만 보여주고 「더보기」로 나머지를 펼칩니다. */
const INITIAL_VISIBLE_PLACES = 3;

/** BE place-contacts의 radiusMeters 상한(1000m). 화면기획의 「내 주위 1km」와 같습니다. */
const PLACE_SEARCH_RADIUS_METERS = 1000;
const PLACE_SEARCH_LIMIT = 10;

type FacilityContactScreenProps = {
  readonly onBack: () => void;
};

/** 도움 02 — 시설 관리자 연락처. */
export function FacilityContactScreen({ onBack }: FacilityContactScreenProps) {
  const insets = useSafeAreaInsets();
  const helpApi = useHelpRequestApi();

  const [coordinates, setCoordinates] = useState<Coordinates>(FALLBACK_COORDINATES);
  const [places, setPlaces] = useState<readonly PlaceContactResponse[]>([]);
  const [expandedPlaceId, setExpandedPlaceId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
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
          const response = await helpApi.findPlaceContacts({
            latitude: current.latitude,
            longitude: current.longitude,
            radiusMeters: PLACE_SEARCH_RADIUS_METERS,
            limit: PLACE_SEARCH_LIMIT,
          });

          if (!isActive) {
            return;
          }

          setCoordinates(current);
          setPlaces(response.placeContacts);
          setExpandedPlaceId(response.placeContacts[0]?.placeId ?? null);
        } catch {
          if (isActive) {
            setLoadError('주변 장소 연락처를 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
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

  const visiblePlaces = showAll ? places : places.slice(0, INITIAL_VISIBLE_PLACES);

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="시설 관리자 연락" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <HelpMapPlaceholder coordinates={coordinates} />

        <View style={styles.intro}>
          <Text color={colors.text.primary} variant="title-1" weight="semibold">
            어떤 장소에 계신가요?
          </Text>
          <Text color={colors.text.secondary} variant="body-1">
            내 주위 {PLACE_SEARCH_RADIUS_METERS / 1000}km 내에 있는 장소의 연락처를 제공합니다
          </Text>
        </View>

        {isLoading ? <ActivityIndicator color={colors.brand.mainAlt} style={styles.loading} /> : null}

        {loadError ? (
          <Text color={colors.semantic.danger.DEFAULT} variant="body-3">
            {loadError}
          </Text>
        ) : null}

        {visiblePlaces.map((place, index) => {
          const isExpanded = place.placeId === expandedPlaceId;

          return (
            <View key={place.placeId} style={styles.placeGroup}>
              <PlaceSelectCard
                address={place.address}
                distanceMeters={place.distanceMeters}
                expanded={isExpanded}
                index={index + 1}
                onPress={() => setExpandedPlaceId(isExpanded ? null : place.placeId)}
                placeName={place.placeName}
                thumbnailUrl={place.thumbnailUrl}
                selected={isExpanded}
              />

              {/* 번호가 없는 장소는 연락처 영역 자체를 그리지 않습니다. */}
              {isExpanded && place.contacts.length > 0 ? (
                <View style={styles.contactList}>
                  {place.contacts.map((contact, contactIndex) => (
                    <View key={`${contact.type}-${contact.telephone}`}>
                      {contactIndex > 0 ? <View style={styles.contactDivider} /> : null}
                      <ContactMethodRow label={contact.label} telephone={contact.telephone} />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}

        {places.length > INITIAL_VISIBLE_PLACES && !showAll ? (
          <Pressable
            accessibilityLabel="장소 더보기"
            accessibilityRole="button"
            onPress={() => setShowAll(true)}
            style={styles.moreButton}
          >
            <Text color={colors.text.primary} variant="body-1">
              더보기 ⌄
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.emergency}>
          <EmergencyCallNotice />
        </View>

        <HelpNoticeBox
          body="개인정보는 수집하지 않으며, 제공한 정보는 도움 요청 목적으로만 사용됩니다."
          title="안전을 위한 안내"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    gap: 12,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 24,
  },
  intro: {
    gap: 4,
    marginTop: 12,
  },
  loading: {
    marginVertical: 24,
  },
  placeGroup: {
    gap: 12,
  },
  contactList: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  contactDivider: {
    backgroundColor: colors.border.regular,
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  moreButton: {
    alignItems: 'center',
    backgroundColor: colors.background.light,
    borderRadius: 12,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emergency: {
    marginVertical: 20,
  },
});
