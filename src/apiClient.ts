export function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured.");
  }

  return apiBaseUrl.replace(/\/+$/, "");
}

export type RequestOptions = {
  method?: "GET" | "POST";
  accessToken?: string;
  body?: unknown;
};

export async function request<TResponse>(path: string, options: RequestOptions = {}): Promise<TResponse> {
  const { method = "GET", accessToken, body } = options;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text || response.statusText };
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response.statusText));
  }

  return payload as TResponse;
}

// 백엔드가 { message: string } 형태의 에러 바디를 내려주면 그걸 그대로 노출하고,
// 그렇지 않은 경우에만 전체 JSON을 fallback으로 사용해 사용자에게 더 읽기 쉬운 메시지를 준다.
function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return JSON.stringify(payload, null, 2) || fallback;
}
