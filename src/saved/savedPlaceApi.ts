import { ApiError, createHttpClient, getApiBaseUrl } from '@/api';
import type { PlaceAccessStatus } from '@/myinfo';

/** 저장 장소 목록 항목. BE SavedPlaceResponse와 1:1입니다. */
export type SavedPlaceResponse = Readonly<{
  placeId: number;
  name: string;
  /** 카테고리 코드. 없는 장소도 있어 null이 옵니다. */
  category: string | null;
  address: string | null;
  thumbnailUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  hasIndoorMap: boolean;
  /** 저장 뒤 장소가 삭제되면 false. 카드에 「이용 정보 없음」으로 표시합니다. */
  isAvailable: boolean;
  savedAt: string;
  /** 이 장소의 상태 변경 알림을 받는지 여부. */
  notificationEnabled: boolean;
  /** 이 장소의 가장 최근 장소 상태 제보. 제보가 없으면 null입니다. */
  latestAccessStatus: PlaceAccessStatus | null;
  latestReportedAt: string | null;
}>;

export type TokenProvider = () => string | null | undefined | Promise<string | null | undefined>;

export type SavedPlaceApiOptions = Readonly<{
  apiBaseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImplementation?: typeof fetch;
}>;

export type SavedPlaceApi = Readonly<{
  /** 최근 저장한 순서로 내가 저장한 장소 전체를 받습니다. */
  findMine(): Promise<readonly SavedPlaceResponse[]>;
  /** 하트 켜기. 이미 저장한 장소를 다시 저장해도 실패하지 않습니다. */
  save(placeId: number): Promise<void>;
  /** 하트 끄기. 저장하지 않은 장소를 해제해도 실패하지 않습니다. */
  unsave(placeId: number): Promise<void>;
  /** 이 장소의 상태 변경 알림만 껐다 켭니다. 받을 알림 종류는 내 정보 › 알림 설정이 정합니다. */
  updateNotification(placeId: number, enabled: boolean): Promise<SavedPlaceResponse>;
}>;

export class SavedPlaceApiError extends ApiError {
  constructor(status: number, errorCode: string | undefined, message: string, data?: unknown) {
    super(status, errorCode, message, data);
    this.name = 'SavedPlaceApiError';
  }
}

const SAVED_PLACES_PATH = '/api/v1/saved-places';

/** 저장/해제는 하트를 누른 장소에 붙는 동작이라 장소 하위 경로를 씁니다. */
const PLACES_PATH = '/api/v1/places';

export function createSavedPlaceApi(options?: SavedPlaceApiOptions): SavedPlaceApi {
  const client = createHttpClient({
    baseUrl: options?.apiBaseUrl ?? getApiBaseUrl(),
    getAccessToken: options?.getAccessToken,
    fetch: options?.fetchImplementation,
  });

  return {
    async findMine() {
      try {
        return await client.get<readonly SavedPlaceResponse[]>(`${SAVED_PLACES_PATH}/me`);
      } catch (error) {
        throw toSavedPlaceApiError(error);
      }
    },

    async save(placeId: number) {
      try {
        await client.post<void>(`${PLACES_PATH}/${placeId}/save`);
      } catch (error) {
        throw toSavedPlaceApiError(error);
      }
    },

    async unsave(placeId: number) {
      try {
        await client.delete<void>(`${PLACES_PATH}/${placeId}/save`);
      } catch (error) {
        throw toSavedPlaceApiError(error);
      }
    },

    async updateNotification(placeId: number, enabled: boolean) {
      try {
        return await client.patch<SavedPlaceResponse, { enabled: boolean }>(
          `${SAVED_PLACES_PATH}/${placeId}/notification`,
          { enabled },
        );
      } catch (error) {
        throw toSavedPlaceApiError(error);
      }
    },
  };
}

function toSavedPlaceApiError(error: unknown): unknown {
  if (error instanceof SavedPlaceApiError) {
    return error;
  }
  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const err = error as {
      status: number;
      errorCode?: string;
      message: string;
      data?: unknown;
    };
    return new SavedPlaceApiError(err.status, err.errorCode, err.message, err.data);
  }
  return error;
}
