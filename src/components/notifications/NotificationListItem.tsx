import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import type { NotificationResponse } from '@/notifications';
import { formatNotificationTime, isOpenable, toNotificationTypeLabel } from '@/notifications';
import { colors } from '@/styles/tokens/colors';

type NotificationListItemProps = {
  readonly notification: NotificationResponse;
  readonly onPress: () => void;
};

/** 알림 목록 한 줄. 안 읽은 알림은 왼쪽 점과 진한 제목으로 구분합니다(색만으로 구분하지 않습니다). */
export function NotificationListItem({ notification, onPress }: NotificationListItemProps) {
  const openable = isOpenable(notification);

  return (
    <Pressable
      accessibilityHint={openable ? '누르면 관련 화면으로 이동합니다' : undefined}
      accessibilityLabel={`${notification.read ? '읽음' : '안 읽음'} · ${notification.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.item}
    >
      <View style={styles.unreadColumn}>
        {notification.read ? null : <View style={styles.unreadDot} />}
      </View>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Text color={colors.brand.mainAlt} variant="caption-2" weight="semibold">
            {toNotificationTypeLabel(notification.type)}
          </Text>
          <Text color={colors.text.disabled} variant="caption-2">
            {formatNotificationTime(notification.createdAt)}
          </Text>
        </View>

        <Text
          color={colors.text.primary}
          variant="body-2"
          weight={notification.read ? 'medium' : 'semibold'}
        >
          {notification.title}
        </Text>
        <Text color={colors.text.secondary} variant="body-3">
          {notification.body}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
  },
  unreadColumn: {
    alignItems: 'center',
    paddingTop: 6,
    width: 10,
  },
  unreadDot: {
    backgroundColor: colors.brand.mainAlt,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
