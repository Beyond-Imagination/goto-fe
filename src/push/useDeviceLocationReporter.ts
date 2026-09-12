import { useCallback } from 'react';

import { reportDeviceLocation, type DeviceLocation } from './deviceLocation';
import { useDeviceTokenApi } from './useDeviceTokenApi';

/**
 * 화면이 알아낸 현재 위치를 서버에 알립니다.
 *
 * 「도움 주기」처럼 사용자가 주변을 보고 있는 화면에서 부르면, 그 반경에 도움 요청이 올라올 때
 * 푸시를 받을 수 있습니다. 위치 권한이 없어 측위에 실패하면 기본 좌표가 오는데, 그건 보고하지
 * 않습니다 — 실제로 그 자리에 있지 않은 사람에게 도움 요청이 가면 안 되기 때문입니다.
 */
export function useDeviceLocationReporter(): (location: DeviceLocation | null) => void {
  const api = useDeviceTokenApi();

  return useCallback(
    (location: DeviceLocation | null) => {
      void reportDeviceLocation(api, location);
    },
    [api],
  );
}
