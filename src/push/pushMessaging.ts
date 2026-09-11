import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

import { logger } from '@/utils/logger';

import type { PushPayload } from './pushRouting';
import type { PushPermission } from './pushRegistrationState';

/**
 * 네이티브 푸시 모듈을 감싼 얇은 층.
 *
 * <p>모든 접근을 lazy require로 감쌉니다. Expo Go(mock 모드)와 Firebase 설정 파일이 없는 빌드에는
 * 네이티브 모듈이 아예 없어서, 최상단 import만으로도 앱이 기동하지 못하기 때문입니다
 * (소셜 로그인 SDK·expo-image-picker와 같은 이유).
 */

/** 안드로이드 알림 채널 id. BE FirebasePushSender.ANDROID_CHANNEL_ID와 같아야 합니다. */
export const ANDROID_CHANNEL_ID = 'goto-default';

/**
 * React Native Firebase는 v22부터 모듈러 API만 제공합니다
 * (`messaging().getToken()` 대신 `getToken(getMessaging())`).
 * 인스턴스와 함수들을 함께 들고 다녀 호출부는 예전처럼 단순하게 씁니다.
 */
type MessagingModule = {
  getToken(): Promise<string>;
  onTokenRefresh(listener: (token: string) => void): () => void;
  onMessage(listener: (message: RemoteMessage) => void): () => void;
  onNotificationOpenedApp(listener: (message: RemoteMessage) => void): () => void;
  getInitialNotification(): Promise<RemoteMessage | null>;
  registerDeviceForRemoteMessages(): Promise<unknown>;
};

type FirebaseMessagingApi = {
  getMessaging: () => unknown;
  getToken: (messaging: unknown) => Promise<string>;
  onTokenRefresh: (messaging: unknown, listener: (token: string) => void) => () => void;
  onMessage: (messaging: unknown, listener: (message: RemoteMessage) => void) => () => void;
  onNotificationOpenedApp: (messaging: unknown, listener: (message: RemoteMessage) => void) => () => void;
  getInitialNotification: (messaging: unknown) => Promise<RemoteMessage | null>;
  registerDeviceForRemoteMessages: (messaging: unknown) => Promise<unknown>;
};

export type RemoteMessage = {
  readonly data?: PushPayload;
  readonly notification?: { readonly title?: string; readonly body?: string };
};

type NotificationsModule = typeof import('expo-notifications');

/**
 * 네이티브 모듈은 한 번만 불러오고 결과를 기억합니다.
 *
 * <p>Firebase 설정 없이 만든 빌드에서는 require 자체가 던지는데, 호출할 때마다 다시 시도하면
 * 개발 중 같은 오류가 화면에 계속 쌓입니다. 실패도 한 번만 기록합니다.
 */
let messagingCache: { readonly value: MessagingModule | null } | null = null;
let notificationsCache: { readonly value: NotificationsModule | null } | null = null;

/**
 * 이 빌드에 푸시 네이티브 모듈이 들어 있는지.
 *
 * <p>Firebase 설정 파일이 없으면 app.config.ts가 플러그인을 붙이지 않아서, 만들어진 앱에는
 * Firebase도 expo-notifications도 없습니다. 그런 빌드에서 모듈을 require하면 잡을 수 없는
 * 네이티브 오류가 개발 화면을 덮습니다. 그래서 먼저 존재 여부만 조용히 확인합니다
 * (TurboModuleRegistry.get은 없으면 null을 돌려주고 던지지 않습니다).
 */
function hasPushNativeSupport(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    return TurboModuleRegistry.get('NativeRNFBTurboApp') != null || NativeModules.RNFBAppModule != null;
  } catch {
    return false;
  }
}

function hasNotificationNativeModule(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 위와 같은 이유입니다.
    const core = require('expo-modules-core') as typeof import('expo-modules-core');
    return core.requireOptionalNativeModule('ExpoPushTokenManager') != null;
  } catch {
    return false;
  }
}

/** 네이티브 모듈이 없으면 null. 호출부는 "푸시를 쓸 수 없는 기기"로 취급합니다. */
function loadMessaging(): MessagingModule | null {
  if (messagingCache !== null) {
    return messagingCache.value;
  }

  if (!hasPushNativeSupport()) {
    logger.debug('푸시 네이티브 모듈이 없는 빌드입니다. 알림 없이 동작합니다.');
    messagingCache = { value: null };
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 정적 import면 네이티브 모듈이 없는 환경에서 기동 자체가 막힙니다.
    const api = require('@react-native-firebase/messaging') as FirebaseMessagingApi;
    if (typeof api?.getMessaging !== 'function') {
      messagingCache = { value: null };
      return null;
    }

    const instance = api.getMessaging();
    messagingCache = {
      value: {
        getToken: () => api.getToken(instance),
        onTokenRefresh: listener => api.onTokenRefresh(instance, listener),
        onMessage: listener => api.onMessage(instance, listener),
        onNotificationOpenedApp: listener => api.onNotificationOpenedApp(instance, listener),
        getInitialNotification: () => api.getInitialNotification(instance),
        registerDeviceForRemoteMessages: () => api.registerDeviceForRemoteMessages(instance),
      },
    };
  } catch (error) {
    logger.warn('FCM 네이티브 모듈이 없어 푸시 없이 동작합니다.', error);
    messagingCache = { value: null };
  }

  return messagingCache.value;
}

function loadNotifications(): NotificationsModule | null {
  if (notificationsCache !== null) {
    return notificationsCache.value;
  }

  // 알림 표시 모듈도 같은 방식으로 존재부터 확인합니다. 없는 빌드에서 require하면
  // 모듈 초기화 중에 잡을 수 없는 오류가 납니다.
  if (!hasNotificationNativeModule()) {
    notificationsCache = { value: null };
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- 위와 같은 이유입니다.
    const module = require('expo-notifications') as NotificationsModule;
    // 네이티브 모듈이 빠진 빌드에서는 require는 되지만 알맹이가 비어 있습니다.
    notificationsCache = { value: typeof module?.getPermissionsAsync === 'function' ? module : null };
  } catch (error) {
    logger.warn('알림 모듈이 없어 알림 표시 없이 동작합니다.', error);
    notificationsCache = { value: null };
  }

  return notificationsCache.value;
}

export function isPushSupported(): boolean {
  return loadMessaging() !== null;
}

/**
 * OS 알림 권한을 확인하고, 아직 묻지 않았으면 물어봅니다.
 * 이미 거부한 사용자에게 다시 묻지 않습니다 — 시스템 설정에서만 되돌릴 수 있습니다.
 */
export async function ensureNotificationPermission(): Promise<PushPermission> {
  const notifications = loadNotifications();
  if (notifications === null) {
    return 'unavailable';
  }

  try {
    const current = await notifications.getPermissionsAsync();
    if (current.granted) {
      return 'granted';
    }
    if (!current.canAskAgain) {
      return 'denied';
    }

    const requested = await notifications.requestPermissionsAsync();
    return requested.granted ? 'granted' : 'denied';
  } catch (error) {
    logger.warn('알림 권한을 확인하지 못했습니다.', error);
    return 'unavailable';
  }
}

/** 권한을 묻지 않고 현재 상태만 봅니다. 알림 설정 화면의 안내에 씁니다. */
export async function getNotificationPermission(): Promise<PushPermission> {
  const notifications = loadNotifications();
  if (notifications === null) {
    return 'unavailable';
  }

  try {
    const current = await notifications.getPermissionsAsync();
    if (current.granted) {
      return 'granted';
    }
    return current.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'unavailable';
  }
}

/** 안드로이드는 채널이 없으면 알림이 표시되지 않습니다(중요도도 채널이 정합니다). */
export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const notifications = loadNotifications();
  if (notifications === null) {
    return;
  }

  try {
    // sound는 번들에 넣은 커스텀 음원 파일 이름을 뜻합니다. 기본 알림음을 쓰려면 지정하지 않습니다.
    await notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: '함께가길 알림',
      importance: notifications.AndroidImportance.DEFAULT,
    });
  } catch (error) {
    logger.warn('안드로이드 알림 채널을 만들지 못했습니다.', error);
  }
}

/**
 * 앱이 화면에 떠 있을 때도 알림을 보여주도록 설정합니다.
 *
 * <p>expo-notifications는 JS 모듈은 불러와지지만 네이티브 모듈이 없으면 호출 시점에 던집니다
 * (Firebase 설정 없이 만든 빌드·Expo Go). 그래서 require뿐 아니라 호출도 감쌉니다.
 */
export function configureForegroundPresentation(): void {
  const notifications = loadNotifications();
  if (notifications === null) {
    return;
  }

  try {
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    logger.warn('알림 표시 설정을 적용하지 못했습니다.', error);
  }
}

/** 이 기기의 FCM 토큰. 권한이 없거나 모듈이 없으면 null. */
export async function getDevicePushToken(): Promise<string | null> {
  const messaging = loadMessaging();
  if (messaging === null) {
    return null;
  }

  try {
    // iOS는 APNs 등록이 끝나야 FCM 토큰이 나옵니다. 최신 버전은 자동으로 하지만 명시해도 안전합니다.
    await messaging.registerDeviceForRemoteMessages();
    const token = await messaging.getToken();
    if (token.trim().length === 0) {
      return null;
    }

    // 개발 빌드에서만 남습니다(logger.debug). 실제 발송 테스트를 하려면 이 토큰이 필요합니다.
    logger.debug('FCM 토큰', token);
    return token;
  } catch (error) {
    logger.warn('FCM 토큰을 받지 못했습니다.', error);
    return null;
  }
}

/** 토큰이 재발급되면 알려줍니다(앱 재설치·복원 등). 구독 해제 함수를 돌려줍니다. */
export function onPushTokenRefresh(listener: (token: string) => void): () => void {
  const messaging = loadMessaging();
  if (messaging === null) {
    return () => undefined;
  }

  try {
    return messaging.onTokenRefresh(listener);
  } catch (error) {
    logger.warn('토큰 갱신 리스너를 붙이지 못했습니다.', error);
    return () => undefined;
  }
}

/** 앱이 떠 있는 동안 도착한 메시지. 시스템이 자동으로 띄워주지 않으므로 직접 표시합니다. */
export function onForegroundMessage(listener: (message: RemoteMessage) => void): () => void {
  const messaging = loadMessaging();
  if (messaging === null) {
    return () => undefined;
  }

  try {
    return messaging.onMessage(listener);
  } catch (error) {
    logger.warn('포그라운드 메시지 리스너를 붙이지 못했습니다.', error);
    return () => undefined;
  }
}

/** 백그라운드 상태에서 알림을 눌러 앱으로 돌아온 경우. */
export function onNotificationOpened(listener: (message: RemoteMessage) => void): () => void {
  const messaging = loadMessaging();
  if (messaging === null) {
    return () => undefined;
  }

  try {
    return messaging.onNotificationOpenedApp(listener);
  } catch (error) {
    logger.warn('알림 탭 리스너를 붙이지 못했습니다.', error);
    return () => undefined;
  }
}

/** 앱이 완전히 꺼져 있다가 알림으로 실행된 경우의 첫 메시지. */
export async function getInitialNotification(): Promise<RemoteMessage | null> {
  const messaging = loadMessaging();
  if (messaging === null) {
    return null;
  }

  try {
    return await messaging.getInitialNotification();
  } catch {
    return null;
  }
}

/** 포그라운드 메시지를 로컬 알림으로 띄웁니다. */
export async function presentLocalNotification(message: RemoteMessage): Promise<void> {
  const notifications = loadNotifications();
  if (notifications === null) {
    return;
  }

  const title = message.notification?.title;
  const body = message.notification?.body;
  if (!title && !body) {
    return;
  }

  try {
    await notifications.scheduleNotificationAsync({
      content: {
        title: title ?? '함께가길',
        body: body ?? '',
        data: (message.data ?? {}) as Record<string, unknown>,
      },
      // 안드로이드는 채널을 지정하지 않으면 expo 기본 채널로 뜹니다. 백그라운드에서
      // 시스템이 띄우는 알림(FCM payload의 channel_id)과 같은 채널을 써야 사용자가 한곳에서 끕니다.
      trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
    });
  } catch (error) {
    logger.warn('알림을 표시하지 못했습니다.', error);
  }
}

/** 로컬 알림(포그라운드에서 띄운 것)을 사용자가 누른 경우. */
export function onLocalNotificationResponse(listener: (data: PushPayload) => void): () => void {
  const notifications = loadNotifications();
  if (notifications === null) {
    return () => undefined;
  }

  try {
    const subscription = notifications.addNotificationResponseReceivedListener(response => {
      listener((response.notification.request.content.data ?? {}) as PushPayload);
    });

    return () => subscription.remove();
  } catch (error) {
    logger.warn('알림 탭 리스너를 붙이지 못했습니다.', error);
    return () => undefined;
  }
}
