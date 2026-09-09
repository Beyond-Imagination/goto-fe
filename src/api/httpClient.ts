import { ApiError, parseErrorResponse } from './apiError';
import { getApiBaseUrl } from './baseUrl';
import type {
  HttpClient,
  HttpClientConfig,
  HttpMethod,
  RequestOptions,
  RequestParams,
} from './types';

/** 이미지 업로드처럼 JSON 직렬화를 우회해야 하는 본문. */
function isMultipartBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

export function createHttpClient(config?: HttpClientConfig): HttpClient {
  const fetchImpl = config?.fetch ?? fetch;

  let activeRefreshPromise: Promise<string | null | undefined> | null = null;

  function resolveBaseUrl(): string {
    if (config?.baseUrl) {
      return config.baseUrl.replace(/\/+$/, '');
    }
    return getApiBaseUrl();
  }

  function buildUrl(path: string, params?: RequestParams): string {
    const baseUrl = resolveBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${baseUrl}${normalizedPath}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null) {
          return;
        }

        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== undefined && item !== null) {
              url.searchParams.append(key, String(item));
            }
          });
        } else {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async function buildHeaders(
    body: unknown,
    options?: RequestOptions<unknown, RequestParams>,
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...config?.defaultHeaders,
      ...options?.headers,
    };

    // FormData는 fetch가 boundary를 붙인 multipart/form-data를 직접 설정합니다.
    // 여기서 Content-Type을 넣으면 boundary가 빠져 서버가 파트를 읽지 못합니다.
    if (body !== undefined && !isMultipartBody(body) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (!options?.skipAuth && config?.getAccessToken) {
      const token = await config.getAccessToken();
      if (token && token.trim().length > 0) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }
    }

    return headers;
  }

  async function executeRefresh(): Promise<string | null | undefined> {
    if (!config?.refreshAccessToken) {
      return null;
    }

    if (!activeRefreshPromise) {
      activeRefreshPromise = config.refreshAccessToken().finally(() => {
        activeRefreshPromise = null;
      });
    }

    return activeRefreshPromise;
  }

  async function request<TResponse, TBody = unknown, TParams extends RequestParams = RequestParams>(
    path: string,
    method: HttpMethod,
    body?: TBody,
    options?: Omit<RequestOptions<TBody, TParams>, 'body'>,
  ): Promise<TResponse> {
    const url = buildUrl(path, options?.params);
    const headers = await buildHeaders(body, options);

    const requestInit: RequestInit = {
      method,
      headers,
      signal: options?.signal,
    };

    if (body !== undefined) {
      if (typeof body === 'string' || isMultipartBody(body)) {
        requestInit.body = body as BodyInit;
      } else {
        requestInit.body = JSON.stringify(body);
      }
    }

    const response = await fetchImpl(url, requestInit);

    // 401 Unauthorized Interceptor: 자동 Refresh Token 갱신 및 재시도
    if (response.status === 401 && !options?.skipRetry && config?.refreshAccessToken) {
      try {
        const newToken = await executeRefresh();

        if (newToken && newToken.trim().length > 0) {
          // 새 토큰으로 1회 재시도 (무한 루프 방지를 위해 skipRetry: true)
          return await request<TResponse, TBody, TParams>(path, method, body, {
            ...options,
            skipRetry: true,
          });
        }
      } catch {
        // 갱신 중 에러 발생 시 아래에서 세션 만료 처리
      }

      // 갱신 실패 또는 새 토큰 발급 불가 시 세션 만료 트리거
      await config.onSessionExpired?.();

      const errorPayload = await parseErrorResponse(
        response,
        '인증이 만료되었습니다. 다시 로그인해주세요.',
      );
      throw new ApiError(401, errorPayload.errorCode, errorPayload.errorMessage, errorPayload.data);
    }

    if (!response.ok) {
      const errorPayload = await parseErrorResponse(response);
      throw new ApiError(
        response.status,
        errorPayload.errorCode,
        errorPayload.errorMessage,
        errorPayload.data,
      );
    }

    if (response.status === 204) {
      return undefined as unknown as TResponse;
    }

    const text = await response.text();
    if (!text) {
      return undefined as unknown as TResponse;
    }

    try {
      return JSON.parse(text) as TResponse;
    } catch {
      return text as unknown as TResponse;
    }
  }

  return {
    get: <TResponse, TParams extends RequestParams = RequestParams>(
      path: string,
      options?: Omit<RequestOptions<never, TParams>, 'body'>,
    ) => request<TResponse, never, TParams>(path, 'GET', undefined, options),

    post: <TResponse, TBody = unknown, TParams extends RequestParams = RequestParams>(
      path: string,
      body?: TBody,
      options?: Omit<RequestOptions<TBody, TParams>, 'body'>,
    ) => request<TResponse, TBody, TParams>(path, 'POST', body, options),

    put: <TResponse, TBody = unknown, TParams extends RequestParams = RequestParams>(
      path: string,
      body?: TBody,
      options?: Omit<RequestOptions<TBody, TParams>, 'body'>,
    ) => request<TResponse, TBody, TParams>(path, 'PUT', body, options),

    patch: <TResponse, TBody = unknown, TParams extends RequestParams = RequestParams>(
      path: string,
      body?: TBody,
      options?: Omit<RequestOptions<TBody, TParams>, 'body'>,
    ) => request<TResponse, TBody, TParams>(path, 'PATCH', body, options),

    delete: <TResponse = void, TParams extends RequestParams = RequestParams>(
      path: string,
      options?: Omit<RequestOptions<never, TParams>, 'body'>,
    ) => request<TResponse, never, TParams>(path, 'DELETE', undefined, options),

    request,
  };
}
