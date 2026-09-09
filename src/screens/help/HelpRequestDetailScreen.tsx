import { useCallback, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFocusEffect } from 'expo-router';

import { Text } from '@/components/common/Text';
import {
  HELP_SCREEN_X,
  HelpDetailTable,
  HelpLocationMap,
  HelpNoticeBox,
  HelpTag,
  type HelpDetailRow,
} from '@/components/help';
import {
  formatHelpKinds,
  formatRemaining,
  isUrgentRemaining,
  minutesUntil,
  useHelpRequestApi,
  type HelpRequestResponse,
} from '@/help';
import { colors } from '@/styles/tokens/colors';

type HelpRequestDetailScreenProps = {
  readonly helpRequestId: string;
  readonly onBack: () => void;
  readonly onAccepted: (helpRequestId: string) => void;
  readonly onRejected: () => void;
};

/** 도우미 02 — 도움 요청 상세. 수락 전이라 대략적인 범위만 보여줍니다. */
export function HelpRequestDetailScreen({
  helpRequestId,
  onBack,
  onAccepted,
  onRejected,
}: HelpRequestDetailScreenProps) {
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

  async function accept() {
    if (isWorking) {
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    try {
      await helpApi.accept(helpRequestId);
      onAccepted(helpRequestId);
    } catch {
      setErrorMessage('요청을 수락하지 못했어요. 이미 다른 분이 수락했을 수 있어요.');
    } finally {
      setIsWorking(false);
    }
  }

  async function reject() {
    if (isWorking) {
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    try {
      await helpApi.reject(helpRequestId);
      onRejected();
    } catch {
      setErrorMessage('처리하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsWorking(false);
    }
  }

  if (!request) {
    return (
      <ModalShell onClose={onBack}>
        <View style={styles.loadingArea}>
          {errorMessage ? (
            <Text color={colors.semantic.danger.DEFAULT} variant="body-3">
              {errorMessage}
            </Text>
          ) : (
            <ActivityIndicator color={colors.brand.mainAlt} />
          )}
        </View>
      </ModalShell>
    );
  }

  const message = request.message ?? '';
  const rows: HelpDetailRow[] = [
    { label: '도움 유형', value: formatHelpKinds(request.kinds) },
    { label: '위치', value: request.locationLabel },
    { label: '층', value: request.floorLevel === null ? '-' : `${request.floorLevel}층` },
    { label: '만료까지', value: `${minutesUntil(request.expiresAt)}분` },
  ];

  return (
    <ModalShell onClose={onBack}>
      <ScrollView contentContainerStyle={styles.content}>
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

        <Text color={colors.text.primary} style={styles.sectionTitle} variant="title-1" weight="semibold">
          요청 위치
        </Text>

        <View style={styles.tagRow}>
          <HelpTag
            label={formatRemaining(request.expiresAt)}
            tone={isUrgentRemaining(request.expiresAt) ? 'urgent' : 'soon'}
          />
        </View>

        <Text color={colors.text.secondary} variant="body-3">
          📍 {request.locationLabel}
        </Text>

        {/* 수락 전에는 서버가 좌표를 소수점 3자리로 뭉갠 값(≈100m)만 내려줍니다. */}
        <HelpLocationMap
          coordinates={{ latitude: request.latitude, longitude: request.longitude }}
          height={200}
          pinLabel="요청 위치"
        />

        <HelpNoticeBox
          body="지금은 대략적인 범위만 보입니다. 요청자의 이름과 연락처는 공개되지 않습니다."
          title="수락하면 정확한 위치가 공개돼요"
        />

        {errorMessage ? (
          <Text color={colors.semantic.danger.DEFAULT} variant="body-3">
            {errorMessage}
          </Text>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityLabel="지금은 어려워요"
          accessibilityRole="button"
          accessibilityState={{ disabled: isWorking }}
          disabled={isWorking}
          onPress={() => void reject()}
          style={[styles.footerButton, styles.rejectButton]}
        >
          <Text color={colors.text.primary} variant="body-2" weight="semibold">
            지금은 어려워요
          </Text>
        </Pressable>

        <Pressable
          accessibilityLabel="도움 주기"
          accessibilityRole="button"
          accessibilityState={{ disabled: isWorking }}
          disabled={isWorking}
          onPress={() => void accept()}
          style={[styles.footerButton, styles.acceptButton]}
        >
          <Text color={colors.text.inverse} variant="body-2" weight="semibold">
            {isWorking ? '처리 중...' : '도움 주기'}
          </Text>
        </Pressable>
      </View>
    </ModalShell>
  );
}

/** 지도 위에 겹쳐 뜨는 팝업 껍데기. 어두운 배경을 누르면 닫힙니다. */
function ModalShell({ children, onClose }: { readonly children: ReactNode; readonly onClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.backdrop}>
      <Pressable
        accessibilityLabel="닫기"
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView
        edges={['top', 'bottom']}
        pointerEvents="box-none"
        style={[styles.cardArea, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text color={colors.text.primary} variant="title-2" weight="semibold">
              도움 요청 상세
            </Text>
            <Pressable
              accessibilityLabel="닫기"
              accessibilityRole="button"
              hitSlop={12}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text color={colors.text.primary} variant="title-2">
                ✕
              </Text>
            </Pressable>
          </View>

          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flex: 1,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: HELP_SCREEN_X,
    // 지도와 상단 헤더가 팝업 위로 보이도록 위쪽을 비워 둡니다.
    paddingTop: 56,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    flex: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    right: HELP_SCREEN_X,
    top: 18,
  },
  content: {
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: HELP_SCREEN_X,
    paddingTop: 4,
  },
  loadingArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
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
  sectionTitle: {
    marginTop: 20,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  footer: {
    backgroundColor: colors.background.primary,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
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
  rejectButton: {
    backgroundColor: colors.background.light,
  },
  acceptButton: {
    backgroundColor: colors.brand.mainAlt,
  },
});
