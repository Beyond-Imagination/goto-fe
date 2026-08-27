import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { startPendingHelpRequestCountLoad } from './pendingHelpRequestCount';
import type { PendingHelpRequestApi } from './pendingHelpRequestApi';

/** 화면이 포커스를 얻을 때마다 pending 수를 다시 조회합니다. */
export function usePendingHelpRequestCount(api: PendingHelpRequestApi | null): number | null {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => startPendingHelpRequestCountLoad(api, setPendingCount), [api]),
  );

  return pendingCount;
}
