import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/auth/session/AuthProvider';
import { getLastKnownCoordinates } from '@/help/currentLocation';
import { logger } from '@/utils/logger';

import { approximateLocation, setRegisteredDeviceToken } from './deviceLocation';
import { useDeviceTokenApi } from './useDeviceTokenApi';
import { usePeriodicDeviceLocation } from './usePeriodicDeviceLocation';
import { decideRegistration, toDevicePlatform, type PushPermission } from './pushRegistrationState';
import { toPushTarget, type PushPayload } from './pushRouting';
import {
  configureForegroundPresentation,
  ensureAndroidChannel,
  ensureNotificationPermission,
  getDevicePushToken,
  getInitialNotification,
  onForegroundMessage,
  onLocalNotificationResponse,
  onNotificationOpened,
  onPushTokenRefresh,
  presentLocalNotification,
} from './pushMessaging';

/**
 * 푸시 수신 배선.
 *
 * <p>하는 일은 네 가지입니다. (1) 로그인하면 권한을 묻고 FCM 토큰을 서버에 등록,
 * (2) 로그아웃하면 해제, (3) 앱이 떠 있을 때 온 메시지를 직접 표시,
 * (4) 알림을 누르면 payload의 route로 이동.
 *
 * <p>네이티브 모듈이 없는 환경(Expo Go·Firebase 설정 없는 빌드)에서는 모든 호출이 조용히
 * 아무 일도 하지 않고, 앱은 푸시 없이 그대로 동작합니다.
 */
export function PushProvider({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const { session } = useAuth();
  const api = useDeviceTokenApi();
  const [permission, setPermission] = useState<PushPermission>('undetermined');
  const [token, setToken] = useState<string | null>(null);

  // 서버에 등록해 둔 토큰. 같은 토큰을 앱 시작마다 다시 보내지 않기 위해 기억합니다.
  const registeredToken = useRef<string | null>(null);
  const isLoggedIn = session !== null && session !== undefined;

  const openFromPayload = useCallback(
    (data: PushPayload | null | undefined) => {
      const target = toPushTarget(data);
      if (target === null) {
        return;
      }

      router.push({ pathname: target.pathname as never, params: target.params });
    },
    [router],
  );

  // 표시 설정과 안드로이드 채널은 로그인과 무관하게 한 번만 준비합니다.
  useEffect(() => {
    configureForegroundPresentation();
    void ensureAndroidChannel();
  }, []);

  // 권한 요청은 로그인 이후에 합니다. 로그인 전에 물으면 무엇에 대한 알림인지 설명할 수 없습니다.
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    let ignore = false;
    void (async () => {
      const granted = await ensureNotificationPermission();
      if (ignore) {
        return;
      }
      setPermission(granted);

      const current = granted === 'granted' ? await getDevicePushToken() : null;
      if (!ignore) {
        setToken(current);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [isLoggedIn]);

  // FCM이 토큰을 재발급하면 서버 등록도 따라가야 합니다.
  useEffect(() => onPushTokenRefresh(next => setToken(next)), []);

  /**
   * 첫 실행에서 APNs 등록이 늦어 토큰을 못 받는 경우가 있습니다(iOS). 그때 그대로 두면
   * 앱을 껐다 켜기 전까지 푸시를 못 받으므로, 앱이 다시 활성화될 때 한 번 더 시도합니다.
   */
  useEffect(() => {
    if (permission !== 'granted' || token !== null) {
      return;
    }

    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') {
        return;
      }

      void (async () => {
        const retried = await getDevicePushToken();
        if (retried !== null) {
          setToken(retried);
        }
      })();
    });

    return () => subscription.remove();
  }, [permission, token]);

  // 로그인/권한/토큰 상태가 바뀔 때마다 서버와 맞춥니다.
  useEffect(() => {
    const action = decideRegistration({
      isLoggedIn,
      permission,
      token,
      registeredToken: registeredToken.current,
    });

    if (action.kind === 'none') {
      return;
    }

    let ignore = false;
    void (async () => {
      try {
        if (action.kind === 'register') {
          const platform = toDevicePlatform(Platform.OS);
          if (platform === null) {
            return;
          }

          // 이미 알고 있는 위치가 있으면 함께 보냅니다. 여기서 새로 측위하지는 않습니다
          // — 로그인 직후에 위치 권한까지 묻는 건 과합니다.
          const known = getLastKnownCoordinates();
          const approximated = known === null ? null : approximateLocation(known);
          await api.register({
            token: action.token,
            platform,
            ...(approximated ? { latitude: approximated.latitude, longitude: approximated.longitude } : {}),
          });
          if (!ignore) {
            registeredToken.current = action.token;
            setRegisteredDeviceToken(action.token);
          }
        } else {
          await api.unregister(action.token);
          if (!ignore) {
            registeredToken.current = null;
            setRegisteredDeviceToken(null);
          }
        }
      } catch (error) {
        // 등록 실패로 앱을 막지 않습니다. 다음 실행·토큰 갱신 때 다시 시도합니다.
        logger.warn('기기 토큰 동기화에 실패했습니다.', error);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [api, isLoggedIn, permission, token]);

  // 등록이 끝난 뒤부터 위치를 주기적으로 갱신합니다(앞에 떠 있는 동안만).
  usePeriodicDeviceLocation(isLoggedIn && permission === 'granted');

  // 앱이 떠 있는 동안 온 메시지는 시스템이 띄워주지 않으므로 직접 표시합니다.
  useEffect(() => onForegroundMessage(message => void presentLocalNotification(message)), []);

  // 백그라운드에서 알림을 눌러 돌아온 경우.
  useEffect(() => onNotificationOpened(message => openFromPayload(message.data)), [openFromPayload]);

  // 포그라운드에서 우리가 띄운 로컬 알림을 누른 경우.
  useEffect(() => onLocalNotificationResponse(data => openFromPayload(data)), [openFromPayload]);

  // 앱이 꺼져 있다가 알림으로 실행된 경우. 첫 화면이 준비된 뒤에 이동합니다.
  useEffect(() => {
    let ignore = false;
    void (async () => {
      const initial = await getInitialNotification();
      if (!ignore && initial) {
        openFromPayload(initial.data);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [openFromPayload]);

  return <>{children}</>;
}
