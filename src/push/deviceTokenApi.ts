import { ApiError, createHttpClient, getApiBaseUrl } from '@/api';

/** BE DevicePlatform과 1:1. */
export type DevicePlatform = 'ANDROID' | 'IOS';

export type RegisterDeviceTokenRequest = Readonly<{
  token: string;
  platform: DevicePlatform;
  appVersion?: string;
  /** 「주변 도움 요청」 푸시 반경 계산용. 위치 권한이 없으면 보내지 않습니다. */
  latitude?: number;
  longitude?: number;
}>;

export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type DeviceTokenApiOptions = Readonly<{
  apiBaseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImplementation?: typeof fetch;
}>;

export type DeviceTokenApi = Readonly<{
  /** 토큰 등록·갱신(멱등). 로그인 직후·토큰 재발급·앱 시작마다 호출합니다. */
  register(request: RegisterDeviceTokenRequest): Promise<void>;
  /** 기기 마지막 위치만 갱신합니다. */
  updateLocation(token: string, latitude: number, longitude: number): Promise<void>;
  /** 로그아웃 시 이 기기로 더 이상 알림을 받지 않습니다. */
  unregister(token: string): Promise<void>;
}>;

export class DeviceTokenApiError extends ApiError {
  constructor(status: number, errorCode: string | undefined, message: string, data?: unknown) {
    super(status, errorCode, message, data);
    this.name = 'DeviceTokenApiError';
  }
}

const BASE_PATH = '/api/v1/members/me/device-tokens';

export function createDeviceTokenApi(options?: DeviceTokenApiOptions): DeviceTokenApi {
  const client = createHttpClient({
    baseUrl: options?.apiBaseUrl ?? getApiBaseUrl(),
    getAccessToken: options?.getAccessToken,
    fetch: options?.fetchImplementation,
  });

  return {
    async register(request) {
      try {
        await client.post<void, RegisterDeviceTokenRequest>(BASE_PATH, request);
      } catch (error) {
        throw toDeviceTokenApiError(error);
      }
    },

    async updateLocation(token, latitude, longitude) {
      try {
        await client.patch<void, { token: string; latitude: number; longitude: number }>(
          `${BASE_PATH}/location`,
          { token, latitude, longitude },
        );
      } catch (error) {
        throw toDeviceTokenApiError(error);
      }
    },

    async unregister(token) {
      try {
        await client.delete<void>(`${BASE_PATH}?token=${encodeURIComponent(token)}`);
      } catch (error) {
        throw toDeviceTokenApiError(error);
      }
    },
  };
}

function toDeviceTokenApiError(error: unknown): unknown {
  if (error instanceof DeviceTokenApiError) {
    return error;
  }
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const err = error as { status: number; errorCode?: string; message: string; data?: unknown };
    return new DeviceTokenApiError(err.status, err.errorCode, err.message, err.data);
  }
  return error;
}
