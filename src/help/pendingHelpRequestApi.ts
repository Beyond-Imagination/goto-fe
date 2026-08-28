export type PendingHelpRequestApi = Readonly<{
  getPendingCount(): Promise<number>;
}>;

const MOCK_PENDING_HELP_REQUEST_COUNT = 2;

/**
 * 백엔드 계약 전 mock 모드에서만 사용하는 비동기 어댑터입니다.
 * 실제 endpoint가 정해지면 이 인터페이스를 구현하는 live 어댑터만 추가합니다.
 */
export function createMockPendingHelpRequestApi(
  count: number = MOCK_PENDING_HELP_REQUEST_COUNT,
): PendingHelpRequestApi {
  return {
    getPendingCount: async () => count,
  };
}

export function getPendingHelpRequestApi(
  authMode: string | undefined = process.env.EXPO_PUBLIC_AUTH_MODE,
): PendingHelpRequestApi | null {
  return authMode === 'mock' ? createMockPendingHelpRequestApi() : null;
}

/** 양수인 안전한 정수만 Figma 배지에 표시합니다. */
export function toVisiblePendingCount(count: number): number | null {
  return Number.isSafeInteger(count) && count > 0 ? count : null;
}
