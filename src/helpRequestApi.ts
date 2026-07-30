import { request } from "./apiClient";

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
  return request<HelpRequestResponse>("/api/v1/help-requests", {
    method: "POST",
    accessToken,
    body: payload
  });
}
