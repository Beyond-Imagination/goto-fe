import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Text } from '@/components/common/Text';
import {
  HELP_SCREEN_X,
  HelpDetailTable,
  HelpHeader,
  HelpNoticeBox,
  type HelpDetailRow,
} from '@/components/help';
import {
  formatHelpKinds,
  minutesUntil,
  useHelpRequestApi,
  type HelpRequestResponse,
} from '@/help';
import { colors } from '@/styles/tokens/colors';

type HelpAcceptedScreenProps = {
  readonly helpRequestId: string;
  readonly onBack: () => void;
  readonly onCanceled: () => void;
};

/** 도우미 03 — 수락 완료. 수락 후에는 정확한 위치가 공개됩니다. */
export function HelpAcceptedScreen({ helpRequestId, onBack, onCanceled }: HelpAcceptedScreenProps) {
  const insets = useSafeAreaInsets();
  const helpApi = useHelpRequestApi();

  const [request, setRequest] = useState<HelpRequestResponse | null>(null);
  const [isWorking, setIsWorking] = useState(false);
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
            setErrorMessage('요청 정보를 불러오지 못했어요.');
          }
        }
      }

      void load();

      return () => {
        isActive = false;
      };
    }, [helpApi, helpRequestId]),
  );

  async function cancelAccept() {
    if (isWorking) {
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    try {
      await helpApi.cancelAccept(helpRequestId);
      onCanceled();
    } catch {
      setErrorMessage('수락을 취소하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsWorking(false);
    }
  }

  if (!request) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <HelpHeader onBack={onBack} title="수락 완료" />
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

  const message = request.message ?? '';
  const rows: HelpDetailRow[] = [
    { label: '정확한 위치', value: request.locationLabel, highlighted: true },
    { label: '도움 유형', value: formatHelpKinds(request.kinds) },
    { label: '위치', value: request.placeName ?? request.locationLabel },
    { label: '층', value: request.floorLevel === null ? '-' : `${request.floorLevel}층` },
    { label: '만료까지', value: `${minutesUntil(request.expiresAt)}분` },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <HelpHeader onBack={onBack} title="수락 완료" />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.hero}>
          <Image source={require('../../assets/logo-mark.png')} style={styles.logo} />
          <Text color={colors.text.primary} style={styles.heroTitle} variant="title-1" weight="semibold">
            도움 요청을 수락했어요
          </Text>
          <Text color={colors.text.secondary} variant="body-1">
            요청자에게 알림이 전달됐어요
          </Text>
        </View>

        <Text color={colors.text.primary} variant="title-1" weight="semibold">
          요청 내용
        </Text>

        <View style={styles.messageBox}>
          <Text color={colors.text.tertiary} variant="caption-1">
            요청자가 남긴 메세지
          </Text>
          <Text color={colors.text.secondary} style={styles.messageText} variant="body-2">
            {message || '남긴 메시지가 없어요.'}
          </Text>
        </View>

        <HelpDetailTable rows={rows} />

        <HelpNoticeBox
          body="요청자와 만나기 전까지 연락처는 공개되지 않습니다. 도움이 끝나면 요청자가 완료 처리합니다."
          title="수락해서 정확한 위치가 공개됐어요"
        />

        {errorMessage ? (
          <Text color={colors.semantic.danger.DEFAULT} variant="body-3">
            {errorMessage}
          </Text>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          accessibilityLabel="수락 취소"
          accessibilityRole="button"
          accessibilityState={{ disabled: isWorking }}
          disabled={isWorking}
          onPress={() => void cancelAccept()}
          style={[styles.footerButton, styles.cancelButton]}
        >
          <Text color={colors.text.primary} variant="body-2" weight="semibold">
            수락 취소
          </Text>
        </Pressable>

        {/* TODO: 경로 안내 화면이 아직 없어 길찾기는 연결 대기 상태입니다. */}
        <Pressable
          accessibilityLabel="길찾기"
          accessibilityRole="button"
          disabled
          style={[styles.footerButton, styles.routeButton]}
        >
          <Text color={colors.text.inverse} variant="body-2" weight="semibold">
            길찾기
          </Text>
        </Pressable>
      </View>
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
  loadingArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  logo: {
    height: 96,
    resizeMode: 'contain',
    width: 96,
  },
  heroTitle: {
    marginTop: 12,
  },
  messageBox: {
    borderColor: colors.border.regular,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  messageText: {
    marginTop: 4,
  },
  footer: {
    backgroundColor: colors.background.primary,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 12,
  },
  footerButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 18,
  },
  cancelButton: {
    backgroundColor: colors.background.light,
  },
  routeButton: {
    backgroundColor: colors.brand.mainAlt,
  },
});
