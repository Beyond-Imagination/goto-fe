/** 플랫폼 refresh token만 이 키에 둔다. access token은 메모리(PlatformSession)에만 둔다. */
export const REFRESH_TOKEN_STORAGE_KEY = 'goto.auth.refresh-token';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

export interface RefreshTokenStore {
  read(): Promise<string | null>;
  write(refreshToken: string): Promise<void>;
  clear(): Promise<void>;
}

export function createRefreshTokenStore(storage: KeyValueStorage): RefreshTokenStore {
  return {
    read: () => storage.getItem(REFRESH_TOKEN_STORAGE_KEY),
    write: (refreshToken) => storage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken),
    clear: () => storage.deleteItem(REFRESH_TOKEN_STORAGE_KEY),
  };
}
