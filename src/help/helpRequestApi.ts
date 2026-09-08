import { ApiError, createHttpClient, getApiBaseUrl } from '@/api';

import type { HelpKind } from './helpKind';

export type PendingHelpCountResponse = Readonly<{
  pendingCount: number;
}>;

export type CreateHelpRequestRequest = Readonly<{
  placeId?: number | null;
  locationLabel: string;
  latitude: number;
  longitude: number;
  floorLevel?: number | null;
  message?: string | null;
  /** BE @NotEmpty — 최소 한 개는 골라야 합니다. */
  kinds: readonly HelpKind[];
  expiresInMinutes?: number | null;
}>;

export type HelpRequestResponse = Readonly<{
  id: string;
  status: string;
  placeId: number | null;
  placeName: string | null;
  locationLabel: string;
  latitude: number;
  longitude: number;
  floorLevel: number | null;
  message: string | null;
  kinds: readonly HelpKind[];
  requesterNickname: string;
  helperNickname: string | null;
  requestedAt: string;
  expiresAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  shareMessage: string;
}>;

export type NearbyHelpRequestResponse = Readonly<{
  id: string;
  placeId: number | null;
  placeName: string | null;
  locationLabel: string;
  message: string | null;
  kinds: readonly HelpKind[];
  distanceMeters: number;
  /**
   * 지도 표시용 근사 좌표. 수락 전에는 정확한 위치를 노출하지 않도록
   * BE가 약 100m 격자로 뭉갠 값을 보냅니다 (화면기획 20.1).
   */
  approximateLatitude: number | null;
  approximateLongitude: number | null;
  requestedAt: string;
  expiresAt: string;
}>;

export type ContactMethodResponse = Readonly<{
  type:
    | 'PLACE_REPRESENTATIVE'
    | 'FACILITY_MANAGER'
    | 'INFORMATION_DESK'
    | 'TOURIST_INFORMATION_CENTER'
    | 'PUBLIC_INSTITUTION'
    | 'EMERGENCY'
    | string;
  label: string;
  telephone: string;
  source: string | null;
}>;

export type PlaceContactResponse = Readonly<{
  placeId: number;
  placeName: string;
  address: string | null;
  matchType: 'SELECTED_PLACE' | 'NEARBY_PLACE' | string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  contactAvailable: boolean;
  contacts: readonly ContactMethodResponse[];
  homepage: string | null;
  thumbnailUrl: string | null;
}>;

export type HelpPlaceContactsResponse = Readonly<{
  emergencyContact: ContactMethodResponse;
  placeContacts: readonly PlaceContactResponse[];
}>;

export type FindPlaceContactsParams = Readonly<{
  placeId?: number;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  limit?: number;
}>;

export type FindNearbyHelpRequestsParams = Readonly<{
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}>;

export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type HelpRequestApiOptions = Readonly<{
  apiBaseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImplementation?: typeof fetch;
}>;

export type HelpRequestApi = Readonly<{
  create(request: CreateHelpRequestRequest): Promise<HelpRequestResponse>;
  findPlaceContacts(params?: FindPlaceContactsParams): Promise<HelpPlaceContactsResponse>;
  countPending(): Promise<PendingHelpCountResponse>;
  findNearby(params: FindNearbyHelpRequestsParams): Promise<readonly NearbyHelpRequestResponse[]>;
  findMine(): Promise<readonly HelpRequestResponse[]>;
  get(id: string): Promise<HelpRequestResponse>;
  accept(id: string): Promise<HelpRequestResponse>;
  cancelAccept(id: string): Promise<HelpRequestResponse>;
  reject(id: string): Promise<void>;
  complete(id: string): Promise<HelpRequestResponse>;
  cancel(id: string): Promise<HelpRequestResponse>;
}>;

export class HelpRequestApiError extends ApiError {
  constructor(status: number, errorCode: string | undefined, message: string, data?: unknown) {
    super(status, errorCode, message, data);
    this.name = 'HelpRequestApiError';
  }
}

export function createHelpRequestApi(options?: HelpRequestApiOptions): HelpRequestApi {
  const client = createHttpClient({
    baseUrl: options?.apiBaseUrl ?? getApiBaseUrl(),
    getAccessToken: options?.getAccessToken,
    fetch: options?.fetchImplementation,
  });

  return {
    async create(request: CreateHelpRequestRequest): Promise<HelpRequestResponse> {
      try {
        return await client.post<HelpRequestResponse, CreateHelpRequestRequest>(
          '/api/v1/help-requests',
          request,
        );
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async findPlaceContacts(params: FindPlaceContactsParams = {}): Promise<HelpPlaceContactsResponse> {
      try {
        return await client.get<HelpPlaceContactsResponse, FindPlaceContactsParams>(
          '/api/v1/help-requests/place-contacts',
          { params },
        );
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async countPending(): Promise<PendingHelpCountResponse> {
      try {
        return await client.get<PendingHelpCountResponse>('/api/v1/help-requests/pending-count');
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async findNearby(params: FindNearbyHelpRequestsParams): Promise<readonly NearbyHelpRequestResponse[]> {
      try {
        return await client.get<readonly NearbyHelpRequestResponse[], FindNearbyHelpRequestsParams>(
          '/api/v1/help-requests/nearby',
          { params },
        );
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async findMine(): Promise<readonly HelpRequestResponse[]> {
      try {
        return await client.get<readonly HelpRequestResponse[]>('/api/v1/help-requests/me');
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async get(id: string): Promise<HelpRequestResponse> {
      try {
        return await client.get<HelpRequestResponse>(`/api/v1/help-requests/${encodeURIComponent(id)}`);
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async accept(id: string): Promise<HelpRequestResponse> {
      try {
        return await client.post<HelpRequestResponse>(
          `/api/v1/help-requests/${encodeURIComponent(id)}/accept`,
        );
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async cancelAccept(id: string): Promise<HelpRequestResponse> {
      try {
        return await client.post<HelpRequestResponse>(
          `/api/v1/help-requests/${encodeURIComponent(id)}/cancel-accept`,
        );
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async reject(id: string): Promise<void> {
      try {
        await client.post<void>(`/api/v1/help-requests/${encodeURIComponent(id)}/reject`);
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async complete(id: string): Promise<HelpRequestResponse> {
      try {
        return await client.post<HelpRequestResponse>(
          `/api/v1/help-requests/${encodeURIComponent(id)}/complete`,
        );
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },

    async cancel(id: string): Promise<HelpRequestResponse> {
      try {
        return await client.post<HelpRequestResponse>(
          `/api/v1/help-requests/${encodeURIComponent(id)}/cancel`,
        );
      } catch (error) {
        throw toHelpRequestApiError(error);
      }
    },
  };
}

function toHelpRequestApiError(error: unknown): unknown {
  if (error instanceof HelpRequestApiError) {
    return error;
  }
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const err = error as { status: number; errorCode?: string; message: string; data?: unknown };
    return new HelpRequestApiError(err.status, err.errorCode, err.message, err.data);
  }
  return error;
}
