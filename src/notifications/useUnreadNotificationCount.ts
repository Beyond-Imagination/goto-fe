import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { startUnreadNotificationCountLoad } from './unreadNotificationCount';
import { useNotificationApi } from './useNotificationApi';

/** 저장 탭 벨 배지에 쓰는 안 읽은 알림 수. 화면에 다시 들어올 때마다 갱신합니다. */
export function useUnreadNotificationCount(): number | null {
  const api = useNotificationApi();
  const [unreadCount, setUnreadCount] = useState<number | null>(null);

  useFocusEffect(useCallback(() => startUnreadNotificationCountLoad(api, setUnreadCount), [api]));

  return unreadCount;
}
