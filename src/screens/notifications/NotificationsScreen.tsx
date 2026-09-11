import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/common/Text';
import { ListDivider } from '@/components/myinfo/ListDivider';
import { ListFooter } from '@/components/myinfo/ListFooter';
import { ErrorView, LoadingView } from '@/components/myinfo/LoadStateView';
import { MyInfoHeader } from '@/components/myinfo/MyInfoHeader';
import { MY_INFO_SCREEN_X } from '@/components/myinfo/tokens';
import { NotificationListItem } from '@/components/notifications/NotificationListItem';
import { usePaginatedResource } from '@/myinfo';
import type { NotificationResponse } from '@/notifications';
import { toPushPayload, useNotificationApi } from '@/notifications';
import { toPushTarget } from '@/push';
import { colors } from '@/styles/tokens/colors';

/** 한 번에 불러오는 알림 수. */
const PAGE_SIZE = 20;

/** 마지막 요소와 화면(홈 인디케이터) 사이 기본 여백. */
const CONTENT_BOTTOM_GAP = 24;

type NotificationsScreenProps = {
  readonly onBack: () => void;
  /** 알림을 눌러 관련 화면으로 이동할 때. 열 화면이 없으면 호출되지 않습니다. */
  readonly onOpen: (target: { pathname: string; params: Record<string, string> }) => void;
};

/**
 * 저장 04 — 받은 알림 목록.
 *
 * <p>저장 탭 우측 상단 벨로 들어옵니다. 푸시는 잠금화면을 지나가면 사라지므로, 놓친 소식을
 * 여기서 다시 봅니다. 항목을 누르면 읽음 처리하고 푸시와 같은 규칙으로 화면을 엽니다.
 */
export function NotificationsScreen({ onBack, onOpen }: NotificationsScreenProps) {
  const insets = useSafeAreaInsets();
  const api = useNotificationApi();
  const [readIds, setReadIds] = useState<readonly number[]>([]);

  const loadPage = useCallback(
    async (cursor: string | null) => {
      const page = await api.findPage({ cursor, size: PAGE_SIZE });
      return { items: page.items, nextCursor: page.nextCursor };
    },
    [api],
  );
  const notifications = usePaginatedResource<NotificationResponse>(
    loadPage,
    '알림을 불러오지 못했어요. 다시 시도해주세요.',
  );

  const open = useCallback(
    (notification: NotificationResponse) => {
      // 읽음 표시는 화면에서 먼저 반영합니다. 목록을 다시 불러올 때까지 기다리면 누른 게 아닌 것처럼 보입니다.
      if (!notification.read) {
        setReadIds(previous => (previous.includes(notification.id) ? previous : [...previous, notification.id]));
        void api.markRead(notification.id).catch(() => undefined);
      }

      const target = toPushTarget(toPushPayload(notification));
      if (target !== null) {
        onOpen(target);
      }
    },
    [api, onOpen],
  );

  const markAllRead = useCallback(() => {
    setReadIds(notifications.items.map(item => item.id));
    void api
      .markAllRead()
      .then(() => notifications.reload())
      .catch(() => undefined);
  }, [api, notifications]);

  if (notifications.state === 'loading') {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="알림" />
        <LoadingView message="알림을 불러오는 중입니다..." />
      </SafeAreaView>
    );
  }

  if (notifications.state === 'error') {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="알림" />
        <ErrorView
          message={notifications.errorMessage ?? '알림을 불러오지 못했어요.'}
          onRetry={notifications.reload}
        />
      </SafeAreaView>
    );
  }

  const items = notifications.items.map(item =>
    readIds.includes(item.id) ? { ...item, read: true } : item,
  );
  const hasUnread = items.some(item => !item.read);

  if (items.length === 0 && !notifications.hasNext) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <MyInfoHeader onBack={onBack} title="알림" />
        <View style={[styles.empty, { paddingBottom: insets.bottom + 64 }]}>
          <Image source={require('../../assets/icons/menu-notification.png')} style={styles.emptyIcon} />
          <Text color={colors.text.primary} style={styles.emptyTitle} variant="title-2" weight="semibold">
            아직 받은 알림이 없어요
          </Text>
          <Text color={colors.text.tertiary} style={styles.emptyBody} variant="body-2">
            {'장소를 저장해 두면 그곳의 변화를\n여기로 알려드려요.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <MyInfoHeader onBack={onBack} title="알림" />
      <FlatList
        ItemSeparatorComponent={ListDivider}
        ListFooterComponent={
          <ListFooter
            endMessage="마지막 알림입니다."
            errorMessage={notifications.loadMoreErrorMessage}
            hasNext={notifications.hasNext}
            isLoadingMore={notifications.isLoadingMore}
            onRetry={notifications.loadMore}
          />
        }
        ListHeaderComponent={
          hasUnread ? (
            <Pressable
              accessibilityLabel="알림 모두 읽음 처리"
              accessibilityRole="button"
              onPress={markAllRead}
              style={styles.markAll}
            >
              <Text color={colors.brand.mainAlt} variant="body-3" weight="semibold">
                모두 읽음
              </Text>
            </Pressable>
          ) : null
        }
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + CONTENT_BOTTOM_GAP }]}
        data={items}
        keyExtractor={item => String(item.id)}
        onEndReached={notifications.loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => (
          <NotificationListItem notification={item} onPress={() => open(item)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  markAll: {
    alignSelf: 'flex-end',
    paddingTop: 18,
    paddingVertical: 6,
  },
  empty: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: MY_INFO_SCREEN_X,
  },
  emptyIcon: {
    height: 48,
    width: 48,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 12,
    textAlign: 'center',
  },
});
