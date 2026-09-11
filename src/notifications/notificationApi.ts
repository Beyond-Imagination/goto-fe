import { ApiError, createHttpClient, getApiBaseUrl } from '@/api';
import type { PushNotificationType } from '@/push/pushRouting';

/** 받은 알림 한 건. BE NotificationResponse와 1:1입니다. */
export type NotificationResponse = Readonly<{
  id: number;
  type: PushNotificationType;
  title: string;
  body: string;
  /** 누르면 열 화면. 없으면 목록에서 읽기만 하는 알림입니다. */
  route: string | null;
  placeId: number | null;
  reportId: number | null;
  helpRequestId: string | null;
  read: boolean;
  createdAt: string;
}>;

export type NotificationPage = Readonly<{
  items: readonly NotificationResponse[];
  /** 다음 페이지 커서. null이면 마지막 페이지입니다. */
  nextCursor: string | null;
  unreadCount: number;
}>;

export type NotificationPageQuery = Readonly<{
  cursor?: string | null;
  size?: number;
}>;

export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type NotificationApiOptions = Readonly<{
  apiBaseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImplementation?: typeof fetch;
}>;

export type NotificationApi = Readonly<{
  findPage(query?: NotificationPageQuery): Promise<NotificationPage>;
  countUnread(): Promise<number>;
  markRead(notificationId: number): Promise<void>;
  markAllRead(): Promise<void>;
}>;

export class NotificationApiError extends ApiError {
  constructor(status: number, errorCode: string | undefined, message: string, data?: unknown) {
    super(status, errorCode, message, data);
    this.name = 'NotificationApiError';
  }
}

const BASE_PATH = '/api/v1/members/me/notifications';

export function createNotificationApi(options?: NotificationApiOptions): NotificationApi {
  const client = createHttpClient({
    baseUrl: options?.apiBaseUrl ?? getApiBaseUrl(),
    getAccessToken: options?.getAccessToken,
    fetch: options?.fetchImplementation,
  });

  return {
    async findPage(query = {}) {
      try {
        return await client.get<NotificationPage>(`${BASE_PATH}${toQueryString(query)}`);
      } catch (error) {
        throw toNotificationApiError(error);
      }
    },

    async countUnread() {
      try {
        const response = await client.get<{ count: number }>(`${BASE_PATH}/unread-count`);
        return response.count;
      } catch (error) {
        throw toNotificationApiError(error);
      }
    },

    async markRead(notificationId: number) {
      try {
        await client.patch<void>(`${BASE_PATH}/${notificationId}/read`);
      } catch (error) {
        throw toNotificationApiError(error);
      }
    },

    async markAllRead() {
      try {
        await client.patch<void>(`${BASE_PATH}/read`);
      } catch (error) {
        throw toNotificationApiError(error);
      }
    },
  };
}

/** 커서는 서버가 준 값을 그대로 돌려주기만 하므로 인코딩만 하고 해석하지 않습니다. */
function toQueryString(query: NotificationPageQuery): string {
  const params = new URLSearchParams();

  if (query.cursor) {
    params.set('cursor', query.cursor);
  }
  if (query.size !== undefined) {
    params.set('size', String(query.size));
  }

  const queryString = params.toString();
  return queryString.length > 0 ? `?${queryString}` : '';
}

function toNotificationApiError(error: unknown): unknown {
  if (error instanceof NotificationApiError) {
    return error;
  }
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const err = error as { status: number; errorCode?: string; message: string; data?: unknown };
    return new NotificationApiError(err.status, err.errorCode, err.message, err.data);
  }
  return error;
}
