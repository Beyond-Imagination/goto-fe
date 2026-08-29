export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestParams = Record<
  string,
  string | number | boolean | undefined | null | readonly (string | number | boolean)[]
>;

export type RequestOptions<TBody = unknown, TParams extends RequestParams = RequestParams> = Readonly<{
  body?: TBody;
  params?: TParams;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  skipRetry?: boolean;
  signal?: AbortSignal;
}>;

export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type TokenRefreshHandler = () => Promise<string | null | undefined>;

export type SessionExpirationHandler = () => void | Promise<void>;

export type HttpClientConfig = Readonly<{
  baseUrl?: string;
  getAccessToken?: TokenProvider;
  refreshAccessToken?: TokenRefreshHandler;
  onSessionExpired?: SessionExpirationHandler;
  fetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}>;

export type HttpClient = Readonly<{
  get<TResponse, TParams extends RequestParams = RequestParams>(
    path: string,
    options?: Omit<RequestOptions<never, TParams>, 'body'>,
  ): Promise<TResponse>;

  post<TResponse, TBody = unknown, TParams extends RequestParams = RequestParams>(
    path: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody, TParams>, 'body'>,
  ): Promise<TResponse>;

  put<TResponse, TBody = unknown, TParams extends RequestParams = RequestParams>(
    path: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody, TParams>, 'body'>,
  ): Promise<TResponse>;

  patch<TResponse, TBody = unknown, TParams extends RequestParams = RequestParams>(
    path: string,
    body?: TBody,
    options?: Omit<RequestOptions<TBody, TParams>, 'body'>,
  ): Promise<TResponse>;

  delete<TResponse = void, TParams extends RequestParams = RequestParams>(
    path: string,
    options?: Omit<RequestOptions<never, TParams>, 'body'>,
  ): Promise<TResponse>;

  request<TResponse, TBody = unknown, TParams extends RequestParams = RequestParams>(
    path: string,
    method: HttpMethod,
    body?: TBody,
    options?: Omit<RequestOptions<TBody, TParams>, 'body'>,
  ): Promise<TResponse>;
}>;
