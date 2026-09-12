import type { DeviceTokenApi, RegisterDeviceTokenRequest } from './deviceTokenApi';

export type MockDeviceTokenRecord = RegisterDeviceTokenRequest & { readonly registeredAt: string };

/** mock 모드에서 서버 없이 등록 흐름을 확인하기 위한 인메모리 저장소. */
let store: MockDeviceTokenRecord[] = [];

export function resetMockDeviceTokenStore(): void {
  store = [];
}

export function mockRegisteredDeviceTokens(): readonly MockDeviceTokenRecord[] {
  return store;
}

export function createMockDeviceTokenApi(): DeviceTokenApi {
  return {
    async register(request) {
      // 실서버와 같은 멱등성: 같은 토큰이면 덮어씁니다.
      store = [
        ...store.filter(record => record.token !== request.token),
        { ...request, registeredAt: new Date().toISOString() },
      ];
    },

    async updateLocation(token, latitude, longitude) {
      store = store.map(record => (record.token === token ? { ...record, latitude, longitude } : record));
    },

    async unregister(token) {
      store = store.filter(record => record.token !== token);
    },
  };
}
