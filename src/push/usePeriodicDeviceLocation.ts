import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { getCoordinatesWithoutPrompt } from '@/help/currentLocation';

import { getRegisteredDeviceToken, reportDeviceLocation } from './deviceLocation';
import {
  LOCATION_REPORT_INTERVAL_MS,
  shouldReportLocation,
  type LocationReport,
} from './locationReportSchedule';
import { useDeviceTokenApi } from './useDeviceTokenApi';

/**
 * 앱을 쓰는 동안 기기 위치를 주기적으로 서버에 갱신합니다.
 *
 * <p>「주변 도움 요청」 푸시가 최근 위치를 기준으로 나가므로, 특정 화면을 열지 않아도
 * 주변 요청을 받을 수 있게 합니다. 앱이 앞에 있을 때만 돌고(백그라운드 측위는 「항상 허용」
 * 권한이 필요합니다), 권한이 없으면 팝업을 띄우지 않고 조용히 건너뜁니다.
 */
export function usePeriodicDeviceLocation(enabled: boolean): void {
  const api = useDeviceTokenApi();
  const lastReport = useRef<LocationReport | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let ignore = false;

    const report = async () => {
      const token = getRegisteredDeviceToken();
      if (token === null) {
        return;
      }

      const location = await getCoordinatesWithoutPrompt();
      if (ignore || location === null) {
        return;
      }

      const now = Date.now();
      if (!shouldReportLocation(lastReport.current, location, now)) {
        return;
      }

      const reported = await reportDeviceLocation(api, location, token);
      if (reported && !ignore) {
        lastReport.current = { location, reportedAt: now };
      }
    };

    void report();
    const timer = setInterval(() => void report(), LOCATION_REPORT_INTERVAL_MS);
    // 앱을 다시 열면 그동안 움직였을 수 있으니 타이머를 기다리지 않고 한 번 보냅니다.
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        void report();
      }
    });

    return () => {
      ignore = true;
      clearInterval(timer);
      subscription.remove();
    };
  }, [api, enabled]);
}
