import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Text } from '@/components/common/Text';
import {
  EmergencyCallNotice,
  HELP_SCREEN_X,
  HelpHeader,
  HelpMapPlaceholder,
  PlaceSelectCard,
} from '@/components/help';
import {
  HELP_REQUEST_REACH_METERS,
  minutesUntil,
  useHelpRequestApi,
  type HelpRequestResponse,
} from '@/help';
import { colors } from '@/styles/tokens/colors';

type HelpRequestPendingScreenProps = {
  readonly helpRequestId: string;
  readonly onBack: () => void;
  readonly onCanceled: () => void;
};

/** 도움 04(전송 후) — 주변 사용자 응답 대기. */
export function HelpRequestPendingScreen({
  helpRequestId,
  onBack,
  onCanceled,
}: HelpRequestPendingScreenProps) {
  const insets = useSafeAreaInsets();
  const helpApi = useHelpRequestApi();

  const [request, setRequest] = useState<HelpRequestResponse | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function load() {
        try {
          const detail = await helpApi.get(helpRequestId);

          if (isActive) {
            setRequest(detail);
          }
        } catch {
          if (isActive) {
            setErrorMessage('요청 상태를 불러오지 못했어요.');
          }
        }
      }

      void load();

      return () => {
        isActive = false;
      };
    }, [helpApi, helpRequestId]),
  );

  async function cancel() {
    if (isCanceling) {
      return;
    }

    setIsCanceling(true);
    setErrorMessage(null);

    try {
      await helpApi.cancel(helpRequestId);
      onCanceled();
    } catch {
      setErrorMessage('요청을 취소하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsCanceling(false);
    }
  }

  if (!request) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <HelpHeader onBack={onBack} title="도움 요청" />
        <View style={styles.loadingArea}>
          {errorMessage ? (
            <Text color={colors.semantic.danger.DEFAULT} variant="body-3">
              {errorMessage}
            </Text>
          ) : (
            <ActivityIndicator color={colors.brand.mainAlt} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const remainingMinutes = minutesUntil(request.expiresAt);
  const message = request.message ?? '';

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="도움 요청" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View>
          <HelpMapPlaceholder
            coordinates={{ latitude: request.latitude, longitude: request.longitude }}
            height={300}
            pinLabel="요청 위치"
          />
          <Pressable
            accessibilityLabel="요청 취소"
            accessibilityRole="button"
            accessibilityState={{ disabled: isCanceling }}
            disabled={isCanceling}
            onPress={() => void cancel()}
            style={styles.cancelButton}
          >
            <Text color={colors.text.tertiary} variant="body-3" weight="medium">
              {isCanceling ? '취소 중...' : '요청 취소'}
            </Text>
          </Pressable>
        </View>

        {/*
          TODO(푸시): 지금은 서버에 푸시 발송이 없어서, 도우미가 「도움 주기」에서 GET /nearby를
          조회할 때 반경 안에 들어오면 목록에 노출되는 pull 방식입니다. 그래서 완료형("보냈어요") 대신
          진행형으로 적었습니다. BE(기기 토큰 저장 + FCM 발송)와 FE(expo-notifications 권한·토큰 등록)에
          푸시가 붙으면 요청 생성 시 반경 내 사용자에게 푸시를 보내는 플로우를 추가하고,
          이 문구도 "요청을 보냈어요" 같은 완료형으로 되돌려야 합니다.
        */}
        <Text color={colors.text.secondary} style={styles.reach} variant="body-2">
          반경 {HELP_REQUEST_REACH_METERS}m 안의 주변 사용자에게 요청을 보내고 있어요
        </Text>

        <Text color={colors.text.primary} variant="title-1" weight="semibold">
          <Text color={colors.brand.mainAlt} variant="title-1" weight="semibold">
            {remainingMinutes}분
          </Text>
          {' 내 도움을 줄 수 있는 사용자에게 요청 중입니다.'}
        </Text>

        {request.placeName ? (
          <PlaceSelectCard
            address={null}
            distanceMeters={null}
            index={1}
            placeName={request.placeName}
          />
        ) : null}

        <View style={styles.locationBox}>
          <Text color={colors.text.secondary} variant="body-2">
            {request.locationLabel}
          </Text>
        </View>

        {message ? (
          <Text color={colors.text.secondary} variant="body-3">
            {message}
          </Text>
        ) : null}

        {errorMessage ? (
          <Text color={colors.semantic.danger.DEFAULT} variant="body-3">
            {errorMessage}
          </Text>
        ) : null}

        <View style={styles.emergency}>
          <EmergencyCallNotice />
        </View>
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
    paddingTop: 16,
  },
  loadingArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.primary,
    borderColor: colors.border.regular,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'absolute',
    right: 16,
    top: 16,
  },
  reach: {
    marginTop: 8,
  },
  locationBox: {
    borderColor: colors.border.black,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emergency: {
    marginTop: 16,
  },
});
