import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/common/Text';
import { getNotificationPermission, type PushPermission } from '@/push';
import { colors } from '@/styles/tokens/colors';

/**
 * 기기(OS) 알림 권한 안내.
 *
 * <p>앱 안의 스위치를 아무리 켜도 OS 권한이 없으면 알림은 오지 않습니다. 그 사실을 설정 화면에서
 * 바로 알 수 있어야 "켰는데 왜 안 와요"가 생기지 않습니다.
 */
export function PushPermissionNotice() {
  const [permission, setPermission] = useState<PushPermission | null>(null);

  useEffect(() => {
    let ignore = false;

    void (async () => {
      const current = await getNotificationPermission();
      if (!ignore) {
        setPermission(current);
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  if (permission === null || permission === 'granted') {
    return null;
  }

  const isUnavailable = permission === 'unavailable';

  return (
    <View style={styles.notice}>
      <Text color={colors.text.primary} variant="body-3" weight="semibold">
        {isUnavailable ? '이 기기에서는 알림을 받을 수 없어요' : '기기 알림이 꺼져 있어요'}
      </Text>
      <Text color={colors.text.secondary} style={styles.body} variant="caption-1">
        {isUnavailable
          ? '알림 기능을 지원하지 않는 환경입니다. 아래 설정은 저장되지만 알림은 오지 않아요.'
          : '아래 설정을 켜도 기기 알림이 꺼져 있으면 알림이 오지 않아요.'}
      </Text>
      {isUnavailable ? null : (
        <Pressable
          accessibilityLabel="기기 알림 설정 열기"
          accessibilityRole="button"
          onPress={() => void Linking.openSettings()}
          style={styles.action}
        >
          <Text color={colors.brand.mainAlt} variant="body-3" weight="semibold">
            기기 설정 열기 ›
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.background.light,
    borderRadius: 10,
    gap: 4,
    marginBottom: 24,
    padding: 14,
  },
  body: {
    marginTop: 2,
  },
  action: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
});
