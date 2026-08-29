  import { createHelpRequestApi, type HelpRequestApiOptions } from './helpRequestApi';

export type PendingHelpRequestApi = Readonly<{
  getPendingCount(): Promise<number>;
}>;

export type PendingHelpRequestApiOptions = HelpRequestApiOptions;

const MOCK_PENDING_HELP_REQUEST_COUNT = 2;

/**
 * 백엔드 Mock 모드에서 사용하는 비동기 어댑터입니다.
 */
export function createMockPendingHelpRequestApi(
  count: number = MOCK_PENDING_HELP_REQUEST_COUNT,
): PendingHelpRequestApi {
  return {
    getPendingCount: async () => count,
  };
}

/**
 * GET /api/v1/help-requests/pending-count 
 */
export function createPendingHelpRequestApi(
  options?: PendingHelpRequestApiOptions,
): PendingHelpRequestApi {
  const helpApi = createHelpRequestApi(options);
  return {
    getPendingCount: async () => {
      const response = await helpApi.countPending();
      return response.pendingCount;
    },
  };
}

export function getPendingHelpRequestApi(
  authMode: string | undefined = process.env.EXPO_PUBLIC_AUTH_MODE,
  options?: PendingHelpRequestApiOptions,
): PendingHelpRequestApi {
  return authMode === 'mock'
    ? createMockPendingHelpRequestApi()
    : createPendingHelpRequestApi(options);
}

/** 양수인 안전한 정수만 Figma 배지에 표시합니다. */
export function toVisiblePendingCount(count: number): number | null {
  return Number.isSafeInteger(count) && count > 0 ? count : null;
}
