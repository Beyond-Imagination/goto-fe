import { useMemo } from 'react';

import { useAuth } from '@/auth/session/AuthProvider';

import { createPlaceApi, type PlaceApi } from './placeApi';

export function usePlaceApi(): PlaceApi {
  const { session } = useAuth();

  return useMemo(
    () => createPlaceApi({ getAccessToken: () => session?.accessToken }),
    [session?.accessToken],
  );
}
