import { getApiBaseUrl } from "./authApi";

export type CreateHelpRequestPayload = {
  placeId?: number | null;
  locationLabel: string;
  latitude: number;
  longitude: number;
  floorLevel?: number | null;
  message?: string | null;
  expiresInMinutes?: number | null;
};

export type HelpRequestResponse = {
  id: string;
  status: string;
  [key: string]: unknown;
};

export async function createHelpRequest(
  accessToken: string,
  payload: CreateHelpRequestPayload
): Promise<HelpRequestResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/help-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { message: text || response.statusText };
  }

  if (!response.ok) {
    throw new Error(JSON.stringify(body, null, 2));
  }

  return body as HelpRequestResponse;
}
