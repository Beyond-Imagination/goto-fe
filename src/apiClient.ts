import { getApiBaseUrl } from "./authApi";
import { logger } from "@/utils/logger";

// API 실패 시 서버가 내려주는 원본 JSON을 그대로 화면(및 스크린리더)에 노출하지 않기 위해,
// 상세 payload는 이 객체에 보존하고 사용자에게는 고정 문구를 보여준다.
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, payload: unknown) {
    super(`API request failed with status ${String(status)}`);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function getJson<TResponse>(path: string, accessToken: string): Promise<TResponse> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text || response.statusText };
  }

  if (!response.ok) {
    logger.error(`[api] ${path} failed (${String(response.status)})`, payload);
    throw new ApiError(response.status, payload);
  }

  return payload as TResponse;
}
