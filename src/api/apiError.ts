export type BackendErrorResponse = Readonly<{
  errorCode?: string;
  errorMessage?: string;
  message?: string;
}>;

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode?: string;
  readonly data?: unknown;

  constructor(status: number, errorCode: string | undefined, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.data = data;
  }
}

export async function parseErrorResponse(
  response: Response,
  fallbackMessage = `API 요청에 실패했습니다. (HTTP ${response.status})`,
): Promise<{ errorCode?: string; errorMessage: string; data?: unknown }> {
  try {
    const text = await response.text();
    if (!text) {
      return {
        errorMessage: response.statusText || fallbackMessage,
      };
    }

    const parsed = JSON.parse(text) as BackendErrorResponse;
    const errorCode = parsed.errorCode;
    const errorMessage = parsed.errorMessage ?? parsed.message ?? response.statusText ?? fallbackMessage;

    return {
      errorCode,
      errorMessage,
      data: parsed,
    };
  } catch {
    return {
      errorMessage: response.statusText || fallbackMessage,
    };
  }
}
