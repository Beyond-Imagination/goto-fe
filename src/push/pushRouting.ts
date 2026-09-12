/**
 * 푸시 payload → 열어야 할 화면.
 *
 * <p>알림 payload는 서버가 보내지만 그대로 믿고 아무 경로나 열지는 않습니다. 아는 경로만
 * 허용하고(allowlist), 파라미터도 아는 키만 문자열로 넘깁니다.
 */

/** BE PushNotificationType과 1:1. */
export type PushNotificationType =
  | 'SAVED_PLACE_STATUS_CHANGE'
  | 'SAVED_PLACE_NEARBY_OBSTACLE'
  | 'MY_REPORT_CONFIRMED'
  | 'MY_REPORT_CONFIRMATION_REQUESTED'
  | 'NEARBY_HELP_REQUEST'
  | 'MY_HELP_REQUEST_ACCEPTED';

/** BE PushMessages의 route 값과 같아야 합니다. */
const ALLOWED_ROUTES = [
  '/(tabs)/saved',
  '/report/detail',
  '/help/request-review',
  '/help/request-pending',
] as const;

export type PushRoute = (typeof ALLOWED_ROUTES)[number];

/** 화면으로 넘길 수 있는 파라미터 키. 이 외의 값은 버립니다. */
const ALLOWED_PARAMS = ['id', 'placeId', 'helpRequestId'] as const;

export type PushTarget = Readonly<{
  pathname: PushRoute;
  params: Readonly<Record<string, string>>;
}>;

export type PushPayload = Readonly<Record<string, unknown>>;

/** 알림을 눌렀을 때 열 화면. 모르는 경로거나 값이 없으면 null(= 아무 것도 하지 않음). */
export function toPushTarget(data: PushPayload | null | undefined): PushTarget | null {
  if (!data) {
    return null;
  }

  const route = asString(data.route);
  if (route === null || !isAllowedRoute(route)) {
    return null;
  }

  const params: Record<string, string> = {};
  for (const key of ALLOWED_PARAMS) {
    const value = asString(data[key]);
    if (value !== null) {
      params[key] = value;
    }
  }

  return { pathname: route, params };
}

/** 알림 종류. 모르는 값이면 null이고, 그때도 route만 맞으면 화면은 열립니다. */
export function toPushNotificationType(data: PushPayload | null | undefined): PushNotificationType | null {
  const type = asString(data?.type);
  const known: readonly string[] = [
    'SAVED_PLACE_STATUS_CHANGE',
    'SAVED_PLACE_NEARBY_OBSTACLE',
    'MY_REPORT_CONFIRMED',
    'MY_REPORT_CONFIRMATION_REQUESTED',
    'NEARBY_HELP_REQUEST',
    'MY_HELP_REQUEST_ACCEPTED',
  ];

  return type !== null && known.includes(type) ? (type as PushNotificationType) : null;
}

function isAllowedRoute(route: string): route is PushRoute {
  return (ALLOWED_ROUTES as readonly string[]).includes(route);
}

/** FCM data는 문자열만 담지만, 로컬 알림을 거쳐 오면 숫자가 그대로 올 수 있습니다. */
function asString(value: unknown): string | null {
  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}
